import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import type { AuthServiceClient } from '@kirillasyamov/common/contracts/generated/auth';
import type {
	UserServiceClient,
	CreateUserResponse,
	GetUserResponse,
	GetUsersResponse,
	UpdateUserResponse,
	TransferBalanceResponse,
} from '@kirillasyamov/common/contracts/generated/user';
import { AUTH_PACKAGE, USER_PACKAGE } from '@/gateway.constants';
import { CreateUserRequestDto, UpdateUserRequestDto, TransferBalanceRequestDto } from './dto';

@Injectable()
export class UserService implements OnModuleInit {
	private readonly logger = new Logger(UserService.name);
	private authGrpcService!: AuthServiceClient;
	private userGrpcService!: UserServiceClient;

	constructor(
		@Inject(AUTH_PACKAGE) private readonly authClient: ClientGrpc,
		@Inject(USER_PACKAGE) private readonly userClient: ClientGrpc,
	) {}

	onModuleInit() {
		this.authGrpcService = this.authClient.getService<AuthServiceClient>('AuthService');
		this.userGrpcService = this.userClient.getService<UserServiceClient>('UserService');
	}

	private async callGrpc<T>(service: string, method: string, operation: () => Promise<T>): Promise<T> {
		const started = Date.now();
		try {
			const result = await operation();
			this.logger.debug(`${service}.${method} ok ${String(Date.now() - started)}ms`);
			return result;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.logger.debug(`${service}.${method} failed ${String(Date.now() - started)}ms: ${message}`);
			throw error;
		}
	}

	public async createUser(accountId: string, data: CreateUserRequestDto): Promise<CreateUserResponse> {
		const { login, email } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		const { age, bio } = data;
		return this.callGrpc('UserService', 'createUser', async () => firstValueFrom(this.userGrpcService.createUser({ login, email, age, bio })));
	}

	public async updateUser(accountId: string, data: UpdateUserRequestDto): Promise<UpdateUserResponse> {
		const { login } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		const { age, bio } = data;
		return this.callGrpc('UserService', 'updateUser', async () => firstValueFrom(this.userGrpcService.updateUser({ login, age, bio })));
	}

	public async getUsers(page: number, limit: number): Promise<GetUsersResponse> {
		return this.callGrpc('UserService', 'getUsers', async () => firstValueFrom(this.userGrpcService.getUsers({ page, limit })));
	}

	public async getUser(login: string): Promise<GetUserResponse> {
		return this.callGrpc('UserService', 'getUser', async () => firstValueFrom(this.userGrpcService.getUser({ login })));
	}

	public async getMe(accountId: string): Promise<GetUserResponse> {
		const { login } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		return this.callGrpc('UserService', 'getUser', async () => firstValueFrom(this.userGrpcService.getUser({ login })));
	}

	public async deleteUser(accountId: string): Promise<void> {
		const { login } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		await this.callGrpc('UserService', 'deleteUser', async () => firstValueFrom(this.userGrpcService.deleteUser({ login })));
	}

	public async transferBalance(accountId: string, request: TransferBalanceRequestDto): Promise<TransferBalanceResponse> {
		const { login: senderLogin } = await this.callGrpc('AuthService', 'getAccountById', async () => firstValueFrom(this.authGrpcService.getAccountById({ id: accountId })));
		const { recipientLogin, amount, idempotencyKey } = request;
		return this.callGrpc('UserService', 'transferBalance', async () =>
			firstValueFrom(this.userGrpcService.transferBalance({ senderLogin, recipientLogin, amount, idempotencyKey })),
		);
	}

	public async resetBalance(): Promise<void> {
		await this.callGrpc('UserService', 'resetBalance', async () => firstValueFrom(this.userGrpcService.resetBalance({})));
	}
}
