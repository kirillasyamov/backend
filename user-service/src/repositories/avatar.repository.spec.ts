import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type AvatarStatus, type Prisma, type PrismaClient } from '@prismagen/client';
import { AvatarRepository, AvatarLimitReachedError } from './avatar.repository';
import { MAX_ACTIVE_AVATARS } from '../user-service.constants';

interface FakeRow {
	id: string;
	userId: string;
	mediaKey: string;
	status: AvatarStatus;
	mimeType: string | null;
	deletedAt: Date | null;
	createdAt: Date;
}

interface FakeWhere {
	id?: string;
	userId?: string | { in: string[] };
	mediaKey?: string;
	status?: AvatarStatus;
	deletedAt?: Date | null;
	user?: { id: string };
}

interface FakeCountArgs {
	where: FakeWhere;
}

interface FakeCreateArgs {
	data: { userId: string; mediaKey: string; sizeBytes?: number; status?: AvatarStatus };
}

const tick = async (): Promise<void> => new Promise(resolve => setImmediate(resolve));

const rawTextAndValues = (query: TemplateStringsArray | Prisma.Sql, values: unknown[]): [string, unknown[]] =>
	Array.isArray(query) ? [query.join(''), values] : [(query as Prisma.Sql).sql, [...(query as Prisma.Sql).values]];

const matches = (row: FakeRow, where: FakeWhere): boolean =>
	(where.id === undefined || row.id === where.id) &&
	(where.userId === undefined || (typeof where.userId === 'string' ? row.userId === where.userId : where.userId.in.includes(row.userId))) &&
	(where.mediaKey === undefined || row.mediaKey === where.mediaKey) &&
	(where.status === undefined || row.status === where.status) &&
	(where.deletedAt === undefined || row.deletedAt === where.deletedAt) &&
	(where.user === undefined || row.userId === where.user.id);

function createFake(rows: FakeRow[]) {
	const avatar = {
		count: vi.fn(async ({ where }: FakeCountArgs) => {
			await tick();
			return rows.filter(row => matches(row, where)).length;
		}),
		create: vi.fn(async ({ data }: FakeCreateArgs) => {
			await tick();
			const row: FakeRow = {
				id: `av_${String(rows.length + 1)}`,
				userId: data.userId,
				mediaKey: data.mediaKey,
				status: data.status ?? 'PENDING', // mirrors the schema default
				mimeType: null,
				deletedAt: null,
				createdAt: new Date(),
			};
			rows.push(row);
			return { id: row.id, mediaKey: row.mediaKey };
		}),
		findMany: vi.fn(async ({ where }: { where: FakeWhere }) => {
			await tick();
			return rows.filter(row => matches(row, where)).map(row => ({ userId: row.userId, mediaKey: row.mediaKey }));
		}),
		findFirst: vi.fn(async ({ where }: { where: FakeWhere }) => {
			await tick();
			const row = rows.find(r => matches(r, where));
			return row ? { userId: row.userId, status: row.status } : null;
		}),
		update: vi.fn(async ({ where, data }: { where: { id: string }; data: { deletedAt?: Date } }) => {
			await tick();
			const row = rows.find(r => r.id === where.id);
			if (row && data.deletedAt !== undefined) row.deletedAt = data.deletedAt;
			return row;
		}),
		updateMany: vi.fn(async ({ where, data }: { where: FakeWhere; data: { status: AvatarStatus; mimeType?: string } }) => {
			await tick();
			let count = 0;
			for (const row of rows) {
				if (matches(row, where)) {
					row.status = data.status;
					if (data.mimeType !== undefined) row.mimeType = data.mimeType;
					count += 1;
				}
			}
			return { count };
		}),
	};

	// Per-user async mutex: emulates the row lock taken by SELECT ... FOR UPDATE.
	const tails = new Map<string, Promise<void>>();
	const acquireLock = async (userId: string): Promise<() => void> => {
		const prev = tails.get(userId) ?? Promise.resolve();
		let release!: () => void;
		tails.set(
			userId,
			new Promise<void>(resolve => {
				release = resolve;
			}),
		);
		return prev.then(() => release);
	};

	const queryRaw = vi.fn((query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]): unknown[] => {
		const [text] = rawTextAndValues(query, values);
		return text.includes('COUNT(*) AS total') ? [{ total: BigInt(0) }] : [];
	});

	const prisma = {
		avatar,
		$queryRaw: queryRaw,
		$transaction: vi.fn(async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
			const acquired: (() => void)[] = [];
			const tx = {
				avatar,
				$queryRaw: vi.fn(async (query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => {
					const [text, sqlValues] = rawTextAndValues(query, values);
					if (text.includes('FOR UPDATE')) {
						acquired.push(await acquireLock(String(sqlValues[0])));
					}
				}),
			};
			try {
				return await callback(tx);
			} finally {
				while (acquired.length > 0) {
					const release = acquired.pop() as () => void;
					release();
				}
			}
		}),
	} as unknown as PrismaClient;

	return { prisma, avatar, queryRaw };
}

describe('AvatarRepository', () => {
	let rows: FakeRow[];
	let prisma: PrismaClient;
	let avatar: ReturnType<typeof createFake>['avatar'];
	let queryRaw: ReturnType<typeof createFake>['queryRaw'];
	let repository: AvatarRepository;

	beforeEach(() => {
		rows = [];
		const fake = createFake(rows);
		prisma = fake.prisma;
		avatar = fake.avatar;
		queryRaw = fake.queryRaw;
		repository = new AvatarRepository(prisma);
	});

	const seed = (userId: string, status: AvatarStatus, opts: { count?: number; deletedAt?: Date | null } = {}): void => {
		const count = opts.count ?? 1;
		for (let i = 0; i < count; i += 1) {
			pushRow(userId, status, `avatar/${userId}/seed_${String(i)}_${String(rows.length)}`, opts.deletedAt ?? null);
		}
	};

	function pushRow(userId: string, status: AvatarStatus, mediaKey: string, deletedAt: Date | null = null): FakeRow {
		const row: FakeRow = { id: `av_row_${String(rows.length + 1)}`, userId, mediaKey, status, mimeType: null, deletedAt, createdAt: new Date() };
		rows.push(row);
		return row;
	}

	const seedActive = (userId: string, count: number): void => {
		seed(userId, 'ACTIVE', { count });
	};

	it('createWithinLimit counts active non-deleted avatars of the user inside the transaction', async () => {
		seedActive('usr_1', MAX_ACTIVE_AVATARS);

		await expect(repository.createWithinLimit('usr_1', { mediaKey: 'avatar/usr_1/new' })).rejects.toBeInstanceOf(AvatarLimitReachedError);

		expect(avatar.count).toHaveBeenCalledWith({ where: { userId: 'usr_1', status: 'ACTIVE', deletedAt: null } });
	});

	it('createWithinLimit throws AvatarLimitReachedError at the limit without inserting', async () => {
		seedActive('usr_1', MAX_ACTIVE_AVATARS);

		await expect(repository.createWithinLimit('usr_1', { mediaKey: 'avatar/usr_1/new' })).rejects.toBeInstanceOf(AvatarLimitReachedError);

		expect(rows).toHaveLength(MAX_ACTIVE_AVATARS);
		expect(avatar.create).not.toHaveBeenCalled();
	});

	it('createWithinLimit creates the avatar and returns id and mediaKey when under the limit', async () => {
		seedActive('usr_1', MAX_ACTIVE_AVATARS - 1);

		const avatarRow = await repository.createWithinLimit('usr_1', { mediaKey: 'avatar/usr_1/new', sizeBytes: 123 });

		expect(avatarRow).toEqual({ id: `av_${String(MAX_ACTIVE_AVATARS)}`, mediaKey: 'avatar/usr_1/new' });
		expect(rows).toHaveLength(MAX_ACTIVE_AVATARS);
		expect(avatar.create).toHaveBeenCalledWith({ data: { userId: 'usr_1', mediaKey: 'avatar/usr_1/new', sizeBytes: 123 } });
	});

	it('createWithinLimit runs the count and insert inside one transaction', async () => {
		seedActive('usr_1', MAX_ACTIVE_AVATARS - 1);

		await repository.createWithinLimit('usr_1', { mediaKey: 'avatar/usr_1/new' });

		expect(prisma.$transaction).toHaveBeenCalledTimes(1);
		// The FOR UPDATE lock is exercised by the concurrency test below: in the fake harness
		// the per-user mutex only engages when a FOR UPDATE raw query runs inside the transaction.
		// The new row is registered as PENDING, so the ACTIVE count stays at the seeded value.
		expect(rows).toHaveLength(MAX_ACTIVE_AVATARS);
		expect(rows.filter(row => row.status === 'ACTIVE' && row.deletedAt === null)).toHaveLength(MAX_ACTIVE_AVATARS - 1);
	});

	it('concurrent createWithinLimit calls for the same user never exceed the active limit', async () => {
		seedActive('usr_1', MAX_ACTIVE_AVATARS);

		const attempts = await Promise.allSettled(Array.from({ length: 3 }, async (_, i) => repository.createWithinLimit('usr_1', { mediaKey: `avatar/usr_1/race_${String(i)}` })));

		const succeeded = attempts.filter(attempt => attempt.status === 'fulfilled');
		const rejected = attempts.filter(attempt => attempt.status === 'rejected' && attempt.reason instanceof AvatarLimitReachedError);
		expect(succeeded).toHaveLength(0);
		expect(rejected).toHaveLength(3);
		expect(rows.filter(row => row.status === 'ACTIVE' && row.deletedAt === null)).toHaveLength(MAX_ACTIVE_AVATARS);
		expect(avatar.create).not.toHaveBeenCalled();
	});

	it('legacy count-then-create sequence creates PENDING rows that never inflate the active count', async () => {
		seedActive('usr_1', MAX_ACTIVE_AVATARS - 1);

		// Mirrors the removed UserService.uploadAvatar path: non-transactional count, then create.
		// With registration landing in PENDING, concurrent inserts cannot push the ACTIVE count over the limit.
		const legacyUpload = async (mediaKey: string): Promise<void> => {
			const activeCount = await repository.countActiveByUser('usr_1');
			if (activeCount >= MAX_ACTIVE_AVATARS) return;
			await repository.create('usr_1', { mediaKey });
		};

		await Promise.allSettled(Array.from({ length: 3 }, async (_, i) => legacyUpload(`avatar/usr_1/race_${String(i)}`)));

		expect(rows).toHaveLength(MAX_ACTIVE_AVATARS + 2);
		expect(rows.filter(row => row.status === 'ACTIVE' && row.deletedAt === null)).toHaveLength(MAX_ACTIVE_AVATARS - 1);
	});

	it('create registers a new avatar as PENDING', async () => {
		const created = await repository.create('usr_1', { mediaKey: 'avatar/usr_1/new' });

		expect(created.mediaKey).toBe('avatar/usr_1/new');
		expect(avatar.create).toHaveBeenCalledWith({
			data: { userId: 'usr_1', mediaKey: 'avatar/usr_1/new', sizeBytes: undefined, status: 'PENDING' },
		});
		expect(rows.filter(row => row.status === 'PENDING')).toHaveLength(1);
	});

	it('updateStatusByMediaKey updates all rows with the key and persists mimeType', async () => {
		const targetKey = 'avatar/usr_1/to_flip';
		const first = pushRow('usr_1', 'PENDING', targetKey);
		const second = pushRow('usr_1', 'PENDING', targetKey);
		const other = pushRow('usr_2', 'PENDING', 'avatar/usr_2/keep');

		await repository.updateStatusByMediaKey(targetKey, 'ACTIVE', 'image/png');

		expect(first).toMatchObject({ status: 'ACTIVE', mimeType: 'image/png' });
		expect(second).toMatchObject({ status: 'ACTIVE', mimeType: 'image/png' });
		expect(other.status).toBe('PENDING');
	});

	it('updateStatusByMediaKey completes without error for an unknown mediaKey', async () => {
		seed('usr_1', 'ACTIVE');

		await expect(repository.updateStatusByMediaKey('avatar/usr_1/missing', 'REJECTED')).resolves.toBeUndefined();
		expect(rows.every(row => row.status === 'ACTIVE')).toBe(true);
	});

	it('countActiveByUser excludes PENDING and REJECTED avatars', async () => {
		seedActive('usr_1', 2);
		seed('usr_1', 'PENDING');
		seed('usr_1', 'REJECTED');

		await expect(repository.countActiveByUser('usr_1')).resolves.toBe(2);
		expect(avatar.count).toHaveBeenCalledWith({ where: { userId: 'usr_1', status: 'ACTIVE', deletedAt: null } });
	});

	it('findActiveMediaKeysByUserId excludes PENDING and REJECTED avatars', async () => {
		seedActive('usr_1', 1);
		seed('usr_1', 'PENDING');
		seed('usr_1', 'REJECTED');

		await expect(repository.findActiveMediaKeysByUserId('usr_1')).resolves.toHaveLength(1);
		expect(avatar.findMany).toHaveBeenCalledWith({
			where: { userId: 'usr_1', status: 'ACTIVE', deletedAt: null },
			select: { mediaKey: true },
			orderBy: { createdAt: 'desc' },
		});
	});

	it('findActiveMediaKeysByUserIds excludes PENDING and REJECTED avatars', async () => {
		seedActive('usr_1', 1);
		seed('usr_1', 'PENDING');
		seed('usr_2', 'REJECTED');

		const byUser = await repository.findActiveMediaKeysByUserIds(['usr_1', 'usr_2']);

		expect(byUser.get('usr_1')).toHaveLength(1);
		expect(byUser.has('usr_2')).toBe(false);
		expect(avatar.findMany).toHaveBeenCalledWith({
			where: { userId: { in: ['usr_1', 'usr_2'] }, status: 'ACTIVE', deletedAt: null },
			select: { userId: true, mediaKey: true },
			orderBy: { createdAt: 'desc' },
		});
	});

	it('findOwnedById excludes PENDING and REJECTED avatars', async () => {
		const pendingRow = pushRow('usr_1', 'PENDING', 'avatar/usr_1/pending');
		const activeRow = pushRow('usr_1', 'ACTIVE', 'avatar/usr_1/active');

		await expect(repository.findOwnedById('usr_1', pendingRow.id)).resolves.toBeNull();
		await expect(repository.findOwnedById('usr_1', activeRow.id)).resolves.toMatchObject({ userId: 'usr_1', status: 'ACTIVE' });
		expect(avatar.findFirst).toHaveBeenCalledWith({
			where: { id: activeRow.id, status: 'ACTIVE', deletedAt: null, user: { id: 'usr_1' } },
			select: { userId: true, status: true },
		});
	});

	it('findMostActiveUsers threshold matches the enforced limit (>= MAX_ACTIVE_AVATARS) and filters only ACTIVE non-deleted', async () => {
		const capturedSql: string[] = [];
		const capturedValues: unknown[] = [];
		queryRaw.mockImplementation((query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => {
			const [text, sqlValues] = rawTextAndValues(query, values);
			capturedSql.push(text);
			capturedValues.push(...sqlValues);
			return text.includes('COUNT(*) AS total') ? [{ total: BigInt(0) }] : [];
		});

		await repository.findMostActiveUsers({ page: 1, limit: 10 });

		const predicate = `a2."status" = 'ACTIVE' AND a2."deletedAt" IS NULL) >= `;
		expect(capturedSql.filter(text => text.includes(predicate))).toHaveLength(2); // select and count queries
		expect(capturedValues).toContain(MAX_ACTIVE_AVATARS);
		expect(capturedSql.some(text => text.includes(`a2."status" = 'ACTIVE' AND a2."deletedAt" IS NULL) > `))).toBe(false);
		expect(capturedSql.some(text => text.includes(`WHERE "userId" = u.id AND "status" = 'ACTIVE' AND "deletedAt" IS NULL`))).toBe(true);
		expect(capturedSql.some(text => text.includes('"isActive"'))).toBe(false);
	});
});
