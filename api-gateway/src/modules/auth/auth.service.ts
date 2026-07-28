import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TokenPair } from 'common/contracts/generated/auth';
import { AuthServiceClient } from 'common/contracts/generated/auth';
import { UserServiceClient } from 'common/contracts/generated/user';
import { Empty } from 'common/contracts/generated/google/protobuf/empty';

import type {
	CreateAccountRequest,
	CreateAccountResponse,
	DeleteAccountRequest,
	CreateSessionRequest,
	CreateSessionResponse,
	RevokeSessionRequest,
} from 'common/contracts/generated/auth';

import type { CreateUserRequest, CreateUserResponse, DeleteUserRequest } from 'common/contracts/generated/user';

interface SignUpRequest {
	login: string;
	email: string;
	password: string;
	device: string;
	age: number;
	bio: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
	private authGrpcService!: AuthServiceClient;
	private userGrpcService!: UserServiceClient;

	constructor(
		@Inject('AUTH_PACKAGE') private authClient: ClientGrpc,
		@Inject('USER_PACKAGE') private userClient: ClientGrpc,
	) {}

	onModuleInit() {
		this.authGrpcService = this.authClient.getService<AuthServiceClient>('AuthService');
		this.userGrpcService = this.userClient.getService<UserServiceClient>('UserService');
	}

	public async signUp(request: SignUpRequest): Promise<TokenPair> {
		const { login, email, password, device, age, bio } = request;
		let accountId, profileId;
		try {
			const account = await this.createAccount({ login, email, password });
			accountId = account.accountId;
			const session = await this.createSession({ accountId: account.accountId, roleId: 1, password, device });
			const user = await this.createUser({ userProfile: { login, email, age, bio } });
			profileId = user.profileId;
			if (session.tokens) return session.tokens;
		} catch (error) {
			if (accountId) await this.deleteAccount({ id: accountId });
			if (profileId) await this.deleteUser({ id: profileId });
			throw error;
		}
		throw new Error('Failed to create access and refresh tokens');
	}

	private async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
		return firstValueFrom(this.userGrpcService.createUser(request));
	}
	private async deleteUser(request: DeleteUserRequest): Promise<Empty> {
		return firstValueFrom(this.userGrpcService.deleteUser(request));
	}
	private async createAccount(request: CreateAccountRequest): Promise<CreateAccountResponse> {
		return firstValueFrom(this.authGrpcService.createAccount(request));
	}
	private async deleteAccount(request: DeleteAccountRequest): Promise<Empty> {
		return firstValueFrom(this.authGrpcService.deleteAccount(request));
	}
	private async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
		return firstValueFrom(this.authGrpcService.createSession(request));
	}

	revokeSession(request: RevokeSessionRequest): Promise<Empty> {
		return firstValueFrom(this.authGrpcService.revokeSession(request));
	}
}
