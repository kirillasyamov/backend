import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { AccountRepository } from './account.repository';
import { SessionRepository } from './session.repository';
import { RoleRepository } from './role.repository';
const DEFAULT_ROLE_ID = 1;
import type {
	AuthServiceController,
	CreateAccountRequest,
	CreateAccountResponse,
	DeleteAccountRequest,
	ChangePasswordRequest,
	ChangeEmailRequest,
	CreateSessionRequest,
	CreateSessionResponse,
	RevokeSessionRequest,
	RefreshSessionRequest,
	RefreshSessionResponse,
	GetSessionsRequest,
	GetSessionsResponse,
	GetAccountByLoginRequest,
	GetAccountByLoginResponse,
	GetAccountByEmailRequest,
	GetAccountByEmailResponse,
	GetAccountByIdRequest,
	GetAccountByIdResponse,
} from '@kirillasyamov/common/contracts/generated/auth';
import type { TokenServiceClient } from '@kirillasyamov/common/contracts/generated/token';
import { hash, verify } from '@node-rs/argon2';
import { randomBytes } from 'crypto';
import { authConfig } from '@kirillasyamov/common/configs';

@Injectable()
export class AuthService implements AuthServiceController, OnModuleInit {
	private tokenGrpcService!: TokenServiceClient;

	constructor(
		@Inject(AccountRepository) private readonly accountRepository: AccountRepository,
		@Inject(SessionRepository) private readonly sessionRepository: SessionRepository,
		@Inject(RoleRepository) private readonly roleRepository: RoleRepository,
		@Inject('TOKEN_PACKAGE') private readonly tokenClient: ClientGrpc,
	) {}

	onModuleInit() {
		this.tokenGrpcService = this.tokenClient.getService<TokenServiceClient>('TokenService');
	}

	public async createAccount(request: CreateAccountRequest): Promise<CreateAccountResponse> {
		try {
			const account = await this.accountRepository.create({
				email: request.email,
				login: request.login,
				passwordHash: await hash(request.password),
				roleId: DEFAULT_ROLE_ID,
			});
			return {
				accountId: account.id,
				login: request.login,
				email: account.email,
				roleId: DEFAULT_ROLE_ID,
			};
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
				const target = (error.meta?.target as string[] | undefined) ?? [];
				const field = target.includes('email') ? 'email' : target.includes('login') ? 'login' : 'value';
				throw new RpcException({
					code: status.ALREADY_EXISTS,
					message: `An account with this ${field} already exists`,
				});
			}
			throw error;
		}
	}

	public async deleteAccount(request: DeleteAccountRequest): Promise<void> {
		if (!request.id) return;
		await this.accountRepository.delete(request.id);
	}

	public async changePassword(request: ChangePasswordRequest): Promise<void> {
		const account = await this.accountRepository.findById(request.accountId);
		if (!account) {
			throw new RpcException({ code: status.NOT_FOUND, message: 'Account not found' });
		}

		const isValid = await verify(account.passwordHash, request.oldPassword);
		if (!isValid) {
			throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Current password is incorrect' });
		}

		await this.accountRepository.updatePassword(request.accountId, await hash(request.newPassword));
		await this.sessionRepository.deleteByAccountId(request.accountId);
	}

	public async changeEmail(request: ChangeEmailRequest): Promise<void> {
		const account = await this.accountRepository.findById(request.accountId);
		if (!account) {
			throw new RpcException({ code: status.NOT_FOUND, message: 'Account not found' });
		}
		await this.accountRepository.updateEmail(request.accountId, request.newEmail);
	}

	public async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
		const account = await this.accountRepository.findById(request.accountId);
		if (!account) {
			throw new RpcException({ code: status.NOT_FOUND, message: 'Account not found' });
		}

		const isValid = await verify(account.passwordHash, request.password);
		if (!isValid) {
			throw new RpcException({ code: status.UNAUTHENTICATED, message: 'Invalid password' });
		}

		const session = await this.sessionRepository.create({
			accountId: request.accountId,
			deviceIdentifier: request.device,
			refreshToken: randomBytes(48).toString('base64'),
			expiresAt: new Date(Date.now() + authConfig.ttlSeconds * 1000),
		});

		const { jsonWebToken } = await firstValueFrom(
			this.tokenGrpcService.generateJwt({
				sub: request.accountId,
				aud: 'api-gateway',
				extraClaims: { sid: session.id, role: account.role.name },
				ttlSeconds: authConfig.ttlSeconds,
			}),
		);

		return {
			tokens: { accessToken: jsonWebToken, refreshToken: session.refreshToken },
			expiresAt: request.expiresAt,
			createdAt: request.createdAt,
		};
	}

	public async revokeSession(request: RevokeSessionRequest): Promise<void> {
		await this.sessionRepository.delete(request.sessionId);
	}

	public async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
		const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
		if (!session) {
			throw new RpcException({ code: status.UNAUTHENTICATED, message: 'Invalid refresh token' });
		}

		if (new Date() > session.expiresAt) {
			await this.sessionRepository.delete(session.id);
			throw new RpcException({ code: status.UNAUTHENTICATED, message: 'Refresh token expired' });
		}

		const newRefreshToken = randomBytes(48).toString('base64');

		await this.sessionRepository.delete(session.id);
		const newSession = await this.sessionRepository.create({
			accountId: session.accountId,
			deviceIdentifier: session.deviceIdentifier,
			refreshToken: newRefreshToken,
			expiresAt: new Date(Date.now() + authConfig.ttlSeconds * 1000),
		});

		const account = await this.accountRepository.findById(session.accountId);
		const { jsonWebToken } = await firstValueFrom(
			this.tokenGrpcService.generateJwt({
				sub: session.accountId,
				aud: 'api-gateway',
				extraClaims: { sid: newSession.id, role: account?.role.name ?? 'user' },
				ttlSeconds: authConfig.ttlSeconds,
			}),
		);

		return { tokens: { accessToken: jsonWebToken, refreshToken: newSession.refreshToken } };
	}

	public async getAccountByLogin(request: GetAccountByLoginRequest): Promise<GetAccountByLoginResponse> {
		const account = await this.accountRepository.findByLogin(request.login);

		if (!account) {
			throw new RpcException({
				code: status.NOT_FOUND,
				message: 'Account not found',
			});
		}

		return {
			accountId: account.id,
			login: account.login,
			email: account.email,
			roleId: account.roleId,
		};
	}

	public async getAccountByEmail(request: GetAccountByEmailRequest): Promise<GetAccountByEmailResponse> {
		const account = await this.accountRepository.findByEmail(request.email);

		if (!account) {
			throw new RpcException({
				code: status.NOT_FOUND,
				message: 'Account not found',
			});
		}

		return {
			accountId: account.id,
			login: account.login,
			email: account.email,
			roleId: account.roleId,
		};
	}

	public async getAccountById(request: GetAccountByIdRequest): Promise<GetAccountByIdResponse> {
		const account = await this.accountRepository.findById(request.id);

		if (!account) {
			throw new RpcException({
				code: status.NOT_FOUND,
				message: 'Account not found',
			});
		}

		return {
			accountId: account.id,
			login: account.login,
			email: account.email,
			roleId: account.roleId,
		};
	}

	public async getSessions(request: GetSessionsRequest): Promise<GetSessionsResponse> {
		if (!request.accountId) return { sessions: [] };
		const sessions = await this.sessionRepository.findManyByAccountId(request.accountId);
		return {
			sessions: sessions.map(s => ({
				id: s.id,
				device: s.deviceIdentifier,
				expiresAt: { seconds: Math.floor(s.expiresAt.getTime() / 1000), nanos: 0 },
				createdAt: { seconds: Math.floor(s.createdAt.getTime() / 1000), nanos: 0 },
			})),
		};
	}
}
