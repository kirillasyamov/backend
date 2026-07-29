import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CLIENT } from 'common/modules/prisma';
import type { PrismaClient } from '../prisma/generated/client';
import { User } from '../prisma/generated/client';

@Injectable()
export class UserRepository {
	constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

	public async create(data: { login: string; email: string; age: number; bio: string }): Promise<User> {
		return this.prisma.user.create({ data });
	}

	public async findByLogin(login: string): Promise<User | null> {
		return this.prisma.user.findUnique({ where: { login } });
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
