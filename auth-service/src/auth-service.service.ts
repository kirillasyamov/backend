import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { AccountRepository, SessionRepository, RoleRepository } from './repositories';
import { DEFAULT_ROLE_ID, JWT_AUDIENCE, DEFAULT_ROLE_NAME, REFRESH_TOKEN_BYTES, TOKEN_PACKAGE } from './auth-service.constants';
import type {
	AuthServiceController as AuthServiceControllerInterface,
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
import { toTimestamp } from '@kirillasyamov/common/utils';

@Injectable()
export class AuthService implements AuthServiceControllerInterface, OnModuleInit {
	private readonly logger = new Logger(AuthService.name);
	private tokenGrpcService!: TokenServiceClient;

	constructor(
		@Inject(AccountRepository) private readonly accountRepository: AccountRepository,
		@Inject(SessionRepository) private readonly sessionRepository: SessionRepository,
		@Inject(RoleRepository) private readonly roleRepository: RoleRepository,
		@Inject(TOKEN_PACKAGE) private readonly tokenClient: ClientGrpc,
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
			this.logger.log(`Account created: id=${account.id} login=${request.login}`);
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
			this.logger.error(`Failed to create account (login=${request.login})`, error instanceof Error ? error.stack : String(error));
			throw error;
		}
	}

	public async deleteAccount(request: DeleteAccountRequest): Promise<void> {
		if (!request.id) return;
		await this.accountRepository.delete(request.id);
		this.logger.log(`Account deleted: id=${request.id}`);
	}

	public async changePassword(request: ChangePasswordRequest): Promise<void> {
		const account = await this.accountRepository.findById(request.accountId);
		if (!account) {
			this.logger.warn(`Password change failed: account ${request.accountId} not found`);
			throw new RpcException({ code: status.NOT_FOUND, message: 'Account not found' });
		}

		const isValid = await verify(account.passwordHash, request.oldPassword);
		if (!isValid) {
			this.logger.warn(`Password change failed for account ${request.accountId}: current password is incorrect`);
			throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Current password is incorrect' });
		}

		await this.accountRepository.updatePassword(request.accountId, await hash(request.newPassword));
		await this.sessionRepository.deleteByAccountId(request.accountId);
		this.logger.log(`Password changed for account ${request.accountId}; sessions revoked`);
	}

	public async changeEmail(request: ChangeEmailRequest): Promise<void> {
		const account = await this.accountRepository.findById(request.accountId);
		if (!account) {
			this.logger.warn(`Email change failed: account ${request.accountId} not found`);
			throw new RpcException({ code: status.NOT_FOUND, message: 'Account not found' });
		}
		await this.accountRepository.updateEmail(request.accountId, request.newEmail);
		this.logger.log(`Email changed for account ${request.accountId}`);
	}

	public async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
		const account = await this.accountRepository.findById(request.accountId);
		if (!account) {
			this.logger.warn(`Session creation failed: account ${request.accountId} not found`);
			throw new RpcException({ code: status.NOT_FOUND, message: 'Account not found' });
		}

		const isValid = await verify(account.passwordHash, request.password);
		if (!isValid) {
			this.logger.warn(`Session creation failed for account ${request.accountId}: invalid password`);
			throw new RpcException({ code: status.UNAUTHENTICATED, message: 'Invalid password' });
		}

		const session = await this.sessionRepository.create({
			accountId: request.accountId,
			deviceIdentifier: request.device,
			refreshToken: randomBytes(REFRESH_TOKEN_BYTES).toString('base64'),
			expiresAt: new Date(Date.now() + authConfig.ttlSeconds * 1000),
		});

		const { jsonWebToken } = await firstValueFrom(
			this.tokenGrpcService.generateJwt({
				sub: request.accountId,
				aud: JWT_AUDIENCE,
				extraClaims: { sid: session.id, role: account.role.name },
				ttlSeconds: authConfig.ttlSeconds,
			}),
		);

		this.logger.log(`Session created: id=${session.id} accountId=${request.accountId}`);
		return {
			tokens: { accessToken: jsonWebToken, refreshToken: session.refreshToken },
			expiresAt: toTimestamp(session.expiresAt),
			createdAt: toTimestamp(session.createdAt),
		};
	}

	public async revokeSession(request: RevokeSessionRequest): Promise<void> {
		await this.sessionRepository.delete(request.sessionId);
		this.logger.log(`Session revoked: id=${request.sessionId}`);
	}

	public async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
		const newRefreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64');

		const session = await this.sessionRepository.rotate(request.refreshToken, {
			refreshToken: newRefreshToken,
			expiresAt: new Date(Date.now() + authConfig.ttlSeconds * 1000),
		});
		if (!session) {
			const expired = await this.sessionRepository.deleteExpiredTokens(request.refreshToken);
			this.logger.warn(`Session refresh failed: ${expired > 0 ? 'refresh token expired' : 'invalid refresh token'}`);
			throw new RpcException({
				code: status.UNAUTHENTICATED,
				message: expired > 0 ? 'Refresh token expired' : 'Invalid refresh token',
			});
		}

		const account = await this.accountRepository.findById(session.accountId);
		const { jsonWebToken } = await firstValueFrom(
			this.tokenGrpcService.generateJwt({
				sub: session.accountId,
				aud: JWT_AUDIENCE,
				extraClaims: { sid: session.id, role: account?.role.name ?? DEFAULT_ROLE_NAME },
				ttlSeconds: authConfig.ttlSeconds,
			}),
		);

		this.logger.log(`Session refreshed: id=${session.id} accountId=${session.accountId}`);
		return { tokens: { accessToken: jsonWebToken, refreshToken: session.refreshToken } };
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
				expiresAt: toTimestamp(s.expiresAt),
				createdAt: toTimestamp(s.createdAt),
			})),
		};
	}
}
