import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import type { AuthServiceClient } from 'common/contracts/generated/auth';
import type { UserServiceClient } from 'common/contracts/generated/user';
import type { UpdateUserResponse } from 'common/contracts/generated/user';

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
}
