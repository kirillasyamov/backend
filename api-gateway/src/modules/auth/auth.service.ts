import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import type {
	AuthServiceClient,
	TokenPair,
	CreateAccountRequest,
	CreateAccountResponse,
	DeleteAccountRequest,
	CreateSessionRequest,
	CreateSessionResponse,
	RevokeSessionRequest,
	RefreshSessionRequest,
} from '@kirillasyamov/common/contracts/generated/auth';

import type { UserServiceClient, CreateUserRequest, CreateUserResponse, DeleteUserRequest } from '@kirillasyamov/common/contracts/generated/user';

import type { Empty } from '@kirillasyamov/common/contracts/generated/google/protobuf/empty';

import { SignUpRequestDto, SignInRequestDto } from './dto';
import { AUTH_PACKAGE, USER_PACKAGE, DEFAULT_ROLE_ID, TOKEN_CREATION_ERROR } from '@/gateway.constants';

@Injectable()
export class AuthService implements OnModuleInit {
	private readonly logger = new Logger(AuthService.name);

	private authGrpcService!: AuthServiceClient;
	private userGrpcService!: UserServiceClient;

	constructor(
		@Inject(AUTH_PACKAGE) private authClient: ClientGrpc,
		@Inject(USER_PACKAGE) private userClient: ClientGrpc,
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

	public async signUp(request: SignUpRequestDto): Promise<TokenPair> {
		const { login, email, password, device, age, bio } = request;
		let accountId, profileId;
		try {
			const account = await this.createAccount({ login, email, password });
			accountId = account.accountId;
			const session = await this.createSession({
				accountId: account.accountId,
				roleId: DEFAULT_ROLE_ID,
				password,
				device,
				expiresAt: undefined,
				createdAt: undefined,
			});
			const user = await this.createUser({ login, email, age, bio });
			profileId = user.profileId;
			if (session.tokens) return session.tokens;
		} catch (error) {
			await this.rollback(accountId, profileId);
			throw error;
		}
		await this.rollback(accountId, profileId);
		throw new InternalServerErrorException(TOKEN_CREATION_ERROR);
	}

	private async rollback(accountId?: string, profileId?: string): Promise<void> {
		if (accountId) {
			try {
				await this.deleteAccount({ id: accountId });
			} catch (error) {
				this.logger.error(`Failed to rollback account ${accountId}`, error instanceof Error ? error.stack : String(error));
			}
		}
		if (profileId) {
			try {
				await this.deleteUser({ id: profileId });
			} catch (error) {
				this.logger.error(`Failed to rollback user ${profileId}`, error instanceof Error ? error.stack : String(error));
			}
		}
	}

	private async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
		return this.callGrpc('UserService', 'createUser', async () => firstValueFrom(this.userGrpcService.createUser(request)));
	}
	private async deleteUser(request: DeleteUserRequest): Promise<Empty> {
		return this.callGrpc('UserService', 'deleteUser', async () => firstValueFrom(this.userGrpcService.deleteUser(request)));
	}
	private async createAccount(request: CreateAccountRequest): Promise<CreateAccountResponse> {
		return this.callGrpc('AuthService', 'createAccount', async () => firstValueFrom(this.authGrpcService.createAccount(request)));
	}
	private async deleteAccount(request: DeleteAccountRequest): Promise<Empty> {
		return this.callGrpc('AuthService', 'deleteAccount', async () => firstValueFrom(this.authGrpcService.deleteAccount(request)));
	}
	private async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
		return this.callGrpc('AuthService', 'createSession', async () => firstValueFrom(this.authGrpcService.createSession(request)));
	}

	async revokeSession(request: RevokeSessionRequest): Promise<Empty> {
		return this.callGrpc('AuthService', 'revokeSession', async () => firstValueFrom(this.authGrpcService.revokeSession(request)));
	}

	async refreshSession(request: RefreshSessionRequest): Promise<TokenPair> {
		const { tokens } = await this.callGrpc('AuthService', 'refreshSession', async () => firstValueFrom(this.authGrpcService.refreshSession(request)));
		if (!tokens) throw new UnauthorizedException('Failed to refresh session');
		return tokens;
	}

	public async signIn(request: SignInRequestDto): Promise<TokenPair> {
		const { login, email, password, device } = request;

		let account: CreateAccountResponse;
		if (login) {
			account = await this.callGrpc('AuthService', 'getAccountByLogin', async () => firstValueFrom(this.authGrpcService.getAccountByLogin({ login })));
		} else {
			if (!email) {
				throw new BadRequestException('Either login or email must be provided');
			}
			account = await this.callGrpc('AuthService', 'getAccountByEmail', async () => firstValueFrom(this.authGrpcService.getAccountByEmail({ email })));
		}

		const { tokens } = await this.createSession({
			accountId: account.accountId,
			roleId: account.roleId,
			password,
			device,
			expiresAt: undefined,
			createdAt: undefined,
		});

		if (tokens) return tokens;
		throw new InternalServerErrorException(TOKEN_CREATION_ERROR);
	}

	async signOut(sessionId: string): Promise<void> {
		await this.revokeSession({ sessionId });
	}
}
