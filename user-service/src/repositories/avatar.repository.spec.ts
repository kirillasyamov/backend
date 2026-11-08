import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Prisma, type PrismaClient } from '@prismagen/client';
import { AvatarRepository, AvatarLimitReachedError } from './avatar.repository';
import { MAX_ACTIVE_AVATARS } from '../user-service.constants';

interface FakeRow {
	userId: string;
	mediaKey: string;
	isActive: boolean;
	deletedAt: Date | null;
}

interface FakeCountArgs {
	where: { userId: string; isActive?: boolean; deletedAt?: Date | null };
}

interface FakeCreateArgs {
	data: { userId: string; mediaKey: string; sizeBytes?: number };
}

const tick = async (): Promise<void> => new Promise(resolve => setImmediate(resolve));

const rawTextAndValues = (query: TemplateStringsArray | Prisma.Sql, values: unknown[]): [string, unknown[]] =>
	Array.isArray(query) ? [query.join(''), values] : [(query as Prisma.Sql).sql, [...(query as Prisma.Sql).values]];

function createFake(rows: FakeRow[]) {
	const avatar = {
		count: vi.fn(async ({ where }: FakeCountArgs) => {
			await tick();
			return rows.filter(
				row =>
					row.userId === where.userId &&
					(where.isActive === undefined || row.isActive === where.isActive) &&
					(!('deletedAt' in where) || row.deletedAt === where.deletedAt),
			).length;
		}),
		create: vi.fn(async ({ data }: FakeCreateArgs) => {
			await tick();
			rows.push({ userId: data.userId, mediaKey: data.mediaKey, isActive: true, deletedAt: null });
			return { id: `av_${String(rows.length)}`, mediaKey: data.mediaKey };
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

	const seedActive = (userId: string, count: number): void => {
		for (let i = 0; i < count; i += 1) {
			rows.push({ userId, mediaKey: `avatar/${userId}/seed_${String(i)}`, isActive: true, deletedAt: null });
		}
	};

	it('createWithinLimit counts active non-deleted avatars of the user inside the transaction', async () => {
		seedActive('usr_1', MAX_ACTIVE_AVATARS);

		await expect(repository.createWithinLimit('usr_1', { mediaKey: 'avatar/usr_1/new' })).rejects.toBeInstanceOf(AvatarLimitReachedError);

		expect(avatar.count).toHaveBeenCalledWith({ where: { userId: 'usr_1', isActive: true, deletedAt: null } });
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
		expect(rows.filter(row => row.isActive && row.deletedAt === null).length).toBe(MAX_ACTIVE_AVATARS);
	});

	it('concurrent createWithinLimit calls for the same user never exceed the limit', async () => {
		seedActive('usr_1', MAX_ACTIVE_AVATARS - 1);

		const attempts = await Promise.allSettled(Array.from({ length: 3 }, async (_, i) => repository.createWithinLimit('usr_1', { mediaKey: `avatar/usr_1/race_${String(i)}` })));

		const succeeded = attempts.filter(attempt => attempt.status === 'fulfilled');
		const rejected = attempts.filter(attempt => attempt.status === 'rejected' && attempt.reason instanceof AvatarLimitReachedError);
		expect(succeeded).toHaveLength(1);
		expect(rejected).toHaveLength(2);
		expect(rows.filter(row => row.isActive && row.deletedAt === null).length).toBe(MAX_ACTIVE_AVATARS);
	});

	it('legacy count-then-create sequence exceeds the limit under the same concurrency (guards the race test)', async () => {
		seedActive('usr_1', MAX_ACTIVE_AVATARS - 1);

		// Mirrors the removed UserService.uploadAvatar path: non-transactional count, then create.
		const legacyUpload = async (mediaKey: string): Promise<void> => {
			const activeCount = await repository.countActiveByUser('usr_1');
			if (activeCount >= MAX_ACTIVE_AVATARS) return;
			await repository.create('usr_1', { mediaKey });
		};

		await Promise.allSettled(Array.from({ length: 3 }, async (_, i) => legacyUpload(`avatar/usr_1/race_${String(i)}`)));

		// Every concurrent call read the same below-limit count and inserted: the limit is blown.
		expect(rows.filter(row => row.isActive && row.deletedAt === null).length).toBeGreaterThan(MAX_ACTIVE_AVATARS);
	});

	it('findMostActiveUsers threshold matches the enforced limit (>= MAX_ACTIVE_AVATARS)', async () => {
		const capturedSql: string[] = [];
		const capturedValues: unknown[] = [];
		queryRaw.mockImplementation((query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => {
			const [text, sqlValues] = rawTextAndValues(query, values);
			capturedSql.push(text);
			capturedValues.push(...sqlValues);
			return text.includes('COUNT(*) AS total') ? [{ total: BigInt(0) }] : [];
		});

		await repository.findMostActiveUsers({ page: 1, limit: 10 });

		const predicate = 'a2."isActive" = true) >= ';
		expect(capturedSql.filter(text => text.includes(predicate))).toHaveLength(2); // select and count queries
		expect(capturedValues).toContain(MAX_ACTIVE_AVATARS);
		expect(capturedSql.some(text => text.includes('a2."isActive" = true) > '))).toBe(false);
	});
});
