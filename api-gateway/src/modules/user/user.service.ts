import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
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
	TransferBalanceRequest,
} from '@kirillasyamov/common/contracts/generated/user';

@Injectable()
export class UserService implements OnModuleInit {
	private authGrpcService!: AuthServiceClient;
	private userGrpcService!: UserServiceClient;

	constructor(
		@Inject('AUTH_PACKAGE') private readonly authClient: ClientGrpc,
		@Inject('USER_PACKAGE') private readonly userClient: ClientGrpc,
	) {}

	onModuleInit() {
		this.authGrpcService = this.authClient.getService<AuthServiceClient>('AuthService');
		this.userGrpcService = this.userClient.getService<UserServiceClient>('UserService');
	}

	public async createUser(accountId: string, data: { age: number; bio: string }): Promise<CreateUserResponse> {
		const { login, email } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		return firstValueFrom(this.userGrpcService.createUser({ login, email, ...data }));
	}

	public async updateUser(accountId: string, data: { age?: number; bio?: string }): Promise<UpdateUserResponse> {
		const { login } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		return firstValueFrom(this.userGrpcService.updateUser({ login, ...data }));
	}

	public async getUsers(page: number, limit: number): Promise<GetUsersResponse> {
		return firstValueFrom(this.userGrpcService.getUsers({ page, limit }));
	}

	public async getUser(login: string): Promise<GetUserResponse> {
		return firstValueFrom(this.userGrpcService.getUser({ login }));
	}

	public async getMe(accountId: string): Promise<GetUserResponse> {
		const { login } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		return firstValueFrom(this.userGrpcService.getUser({ login }));
	}

	public async deleteUser(accountId: string): Promise<void> {
		const { login } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		await firstValueFrom(this.userGrpcService.deleteUser({ login }));
	}

	public async transferBalance(accountId: string, request: Omit<TransferBalanceRequest, 'senderLogin'>): Promise<TransferBalanceResponse> {
		const { login: senderLogin } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		return firstValueFrom(this.userGrpcService.transferBalance({ senderLogin, ...request }));
	}

	public async resetBalance(): Promise<void> {
		await firstValueFrom(this.userGrpcService.resetBalance({}));
	}
}
