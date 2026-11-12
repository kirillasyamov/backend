import type { Account, Role } from '@prismagen/client';

export interface IRegistrationData {
	email: string;
	login: string;
	passwordHash: string;
	roleId: number;
}

export type IAccountWithRole = Account & { role: Role };
