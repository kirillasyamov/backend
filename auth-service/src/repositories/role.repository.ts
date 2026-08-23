import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CLIENT } from '@kirillasyamov/common';
import { type PrismaClient, Role } from '@prismagen/client';

@Injectable()
export class RoleRepository {
	constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

	public async findById(id: number): Promise<Role | null> {
		return this.prisma.role.findUnique({ where: { id } });
	}

	public async create(data: { id: number; name: string }): Promise<Role> {
		return this.prisma.role.create({ data });
	}
}
