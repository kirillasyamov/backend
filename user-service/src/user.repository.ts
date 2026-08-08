import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CLIENT } from '@kirillasyamov/common';
import { User, Prisma, type PrismaClient } from '../prisma/generated/client';

@Injectable()
export class UserRepository {
	constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

	public async reactivateOrCreate(data: { login: string; email: string; age: number; bio: string }): Promise<User> {
		const existing = await this.prisma.user.findFirst({
			where: {
				OR: [
					{ login: data.login, deletedAt: { not: null } },
					{ email: data.email, deletedAt: { not: null } },
				],
			},
		});

		if (existing) {
			return this.prisma.user.update({
				where: { id: existing.id },
				data: { ...data, deletedAt: null },
			});
		}

		return this.prisma.user.create({ data });
	}

	public async findAll(page: number, limit: number): Promise<{ users: User[]; total: number }> {
		const [users, total] = await this.prisma.$transaction([
			this.prisma.user.findMany({
				where: { deletedAt: null },
				skip: (page - 1) * limit,
				take: limit,
			}),
			this.prisma.user.count({ where: { deletedAt: null } }),
		]);
		return { users, total };
	}

	public async findByLogin(login: string): Promise<User | null> {
		return this.prisma.user.findFirst({ where: { login, deletedAt: null } });
	}

	public async update(login: string, data: { age?: number; bio?: string }): Promise<User> {
		return this.prisma.user.update({ where: { login }, data });
	}

	public async softDelete(id: string): Promise<User> {
		return this.prisma.user.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}

	public async transferBalance(fromId: string, toId: string, amount: Prisma.Decimal, idempotencyKey: string): Promise<void> {
		try {
			await this.prisma.$transaction(async tx => {
				await tx.transfer.create({ data: { idempotencyKey, fromUserId: fromId, toUserId: toId, amount } });
				await tx.user.update({ where: { id: fromId }, data: { balance: { decrement: amount } } });
				await tx.user.update({ where: { id: toId }, data: { balance: { increment: amount } } });
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
			throw error;
		}
	}

	public async resetBalances(): Promise<void> {
		await this.prisma.user.updateMany({ where: { deletedAt: null }, data: { balance: 0 } });
	}
}
