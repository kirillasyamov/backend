import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CLIENT } from '@kirillasyamov/common';
import { type PrismaClient, Account } from '../prisma/generated/client';

export interface RegistrationData {
	email: string;
	login: string;
	passwordHash: string;
	roleId: number;
}

@Injectable()
export class AccountRepository {
	constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

	public async create(data: RegistrationData): Promise<Account> {
		return this.prisma.account.create({ data });
	}

	public async findByLogin(login: string): Promise<Account | null> {
		return this.prisma.account.findUnique({ where: { login } });
	}

	public async findByEmail(email: string): Promise<Account | null> {
		return this.prisma.account.findUnique({ where: { email } });
	}

	public async findById(id: string): Promise<Account | null> {
		return this.prisma.account.findUnique({ where: { id } });
	}

	public async updatePassword(id: string, passwordHash: string): Promise<Account> {
		return this.prisma.account.update({ where: { id }, data: { passwordHash } });
	}

	public async updateEmail(id: string, email: string): Promise<Account> {
		return this.prisma.account.update({ where: { id }, data: { email } });
	}

	public async delete(id: string): Promise<Account> {
		return this.prisma.account.delete({ where: { id } });
	}
}
