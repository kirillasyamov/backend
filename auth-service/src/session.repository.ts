import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CLIENT } from '@kirillasyamov/common';
import { type PrismaClient, Session } from '../prisma/generated/client';

@Injectable()
export class SessionRepository {
	constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

	public async create(data: { accountId: string; deviceIdentifier: string; refreshToken: string; expiresAt: Date }): Promise<Session> {
		return this.prisma.session.create({ data });
	}

	public async findById(id: string): Promise<Session | null> {
		return this.prisma.session.findUnique({ where: { id } });
	}

	public async findByRefreshToken(refreshToken: string): Promise<Session | null> {
		return this.prisma.session.findUnique({ where: { refreshToken } });
	}

	public async findManyByAccountId(accountId: string): Promise<Session[]> {
		return this.prisma.session.findMany({ where: { accountId } });
	}

	public async delete(id: string): Promise<Session> {
		return this.prisma.session.delete({ where: { id } });
	}

	public async deleteByAccountId(accountId: string): Promise<number> {
		const result = await this.prisma.session.deleteMany({ where: { accountId } });
		return result.count;
	}
}
