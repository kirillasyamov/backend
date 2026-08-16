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
} from '@kirillasyamov/common/contracts/generated/user';
import { AUTH_PACKAGE, USER_PACKAGE } from '@/gateway.constants';
import { CreateUserRequestDto, UpdateUserRequestDto, TransferBalanceRequestDto } from './dto';

@Injectable()
export class UserService implements OnModuleInit {
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

	public async createUser(accountId: string, data: CreateUserRequestDto): Promise<CreateUserResponse> {
		const { login, email } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		const { age, bio } = data;
		return firstValueFrom(this.userGrpcService.createUser({ login, email, age, bio }));
	}

	public async updateUser(accountId: string, data: UpdateUserRequestDto): Promise<UpdateUserResponse> {
		const { login } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		const { age, bio } = data;
		return firstValueFrom(this.userGrpcService.updateUser({ login, age, bio }));
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

	public async transferBalance(accountId: string, request: TransferBalanceRequestDto): Promise<TransferBalanceResponse> {
		const { login: senderLogin } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		const { recipientLogin, amount, idempotencyKey } = request;
		return firstValueFrom(this.userGrpcService.transferBalance({ senderLogin, recipientLogin, amount, idempotencyKey }));
	}

	public async resetBalance(): Promise<void> {
		await firstValueFrom(this.userGrpcService.resetBalance({}));
	}
}
