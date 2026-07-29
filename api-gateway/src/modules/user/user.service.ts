import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import type { AuthServiceClient } from 'common/contracts/generated/auth';
import type { UserServiceClient } from 'common/contracts/generated/user';
import type { CreateUserResponse, UpdateUserResponse } from 'common/contracts/generated/user';

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
		return firstValueFrom(this.userGrpcService.createUser({ userProfile: { login, email, ...data } }));
	}

	public async updateUser(accountId: string, data: { age?: number; bio?: string }): Promise<UpdateUserResponse> {
		const { login } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		return firstValueFrom(this.userGrpcService.updateUser({ login, ...data }));
	}

	public async deleteUser(accountId: string): Promise<void> {
		const { login } = await firstValueFrom(this.authGrpcService.getAccountById({ id: accountId }));
		await firstValueFrom(this.userGrpcService.deleteUser({ login }));
	}
}
