import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CLIENT } from 'common/modules/prisma';
import type { PrismaClient } from '../prisma/generated/client';
import { User } from '../prisma/generated/client';

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
}
