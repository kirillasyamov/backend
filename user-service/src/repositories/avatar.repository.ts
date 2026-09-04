import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CLIENT } from '@kirillasyamov/common';
import { Prisma, type PrismaClient } from '@prismagen/client';
import { MAX_ACTIVE_AVATARS } from '../user-service.constants';

export interface MostActiveUserRow {
	id: string;
	login: string;
	email: string;
	age: number;
	bio: string;
	balance: Prisma.Decimal;
	avatarId: string | null;
	avatarMediaKey: string | null;
	avatarMimeType: string | null;
	avatarCreatedAt: Date | string | null;
}

export interface MostActiveUsersPage {
	users: MostActiveUserRow[];
	total: number;
}

@Injectable()
export class AvatarRepository {
	constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

	public async countActiveByUser(userId: string): Promise<number> {
		return this.prisma.avatar.count({ where: { userId, isActive: true } });
	}

	public async create(
		userId: string,
		data: { mediaKey: string; fileName?: string; sizeBytes?: number },
	): Promise<{
		id: string;
		mediaKey: string;
	}> {
		const avatar = await this.prisma.avatar.create({
			data: {
				userId,
				mediaKey: data.mediaKey,
				sizeBytes: data.sizeBytes,
			},
		});
		return { id: avatar.id, mediaKey: avatar.mediaKey };
	}

	public async findOwnedById(accountId: string, avatarId: string): Promise<{ userId: string; isActive: boolean } | null> {
		const avatar = await this.prisma.avatar.findFirst({
			where: { id: avatarId, isActive: true, user: { id: accountId } },
			select: { userId: true, isActive: true },
		});
		return avatar;
	}

	public async softDelete(avatarId: string): Promise<void> {
		await this.prisma.avatar.update({
			where: { id: avatarId },
			data: { isActive: false, deletedAt: new Date() },
		});
	}

	public async findMostActiveUsers(options: { minAge?: number; maxAge?: number; page: number; limit: number }): Promise<MostActiveUsersPage> {
		const { page, limit } = options;
		const where: Prisma.Sql[] = [
			Prisma.sql`u."deletedAt" IS NULL`,
			Prisma.sql`u.bio <> ''`,
			Prisma.sql`(SELECT COUNT(*) FROM "avatar" a2 WHERE a2."userId" = u.id AND a2."isActive" = true) > ${MAX_ACTIVE_AVATARS}`,
		];
		if (options.minAge !== undefined) where.push(Prisma.sql`u.age >= ${options.minAge}`);
		if (options.maxAge !== undefined) where.push(Prisma.sql`u.age <= ${options.maxAge}`);

		const whereSql = Prisma.join(where, ' AND ');

		const users = await this.prisma.$queryRaw<unknown[]>(
			Prisma.sql`
				SELECT
					u.id, u.login, u.email, u.age, u.bio, u.balance,
					a.id AS "avatarId",
					a."mediaKey" AS "avatarMediaKey",
					a."mimeType" AS "avatarMimeType",
					a."createdAt" AS "avatarCreatedAt"
				FROM "user" u
				LEFT JOIN LATERAL (
					SELECT id, "mediaKey", "mimeType", "createdAt"
					FROM "avatar"
					WHERE "userId" = u.id
					ORDER BY "createdAt" DESC
					LIMIT 1
				) a ON true
				WHERE ${whereSql}
				ORDER BY u."createdAt" DESC
				LIMIT ${limit} OFFSET ${(page - 1) * limit}
			`,
		);

		const countResult = await this.prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT COUNT(*) AS total FROM "user" u WHERE ${whereSql}`);

		return {
			users: (users as MostActiveUserRow[]).map(row => ({
				...row,
				balance: row.balance instanceof Prisma.Decimal ? row.balance : new Prisma.Decimal(String(row.balance)),
			})),
			total: Number(countResult[0]?.total ?? 0),
		};
	}
}
