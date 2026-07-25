import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { AccountRepository } from './account.repository';
import { SessionRepository } from './session.repository';
import { RoleRepository } from './role.repository';
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
} from 'common/contracts/generated/auth';
import { hash } from '@node-rs/argon2';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService implements AuthServiceController {
	constructor(
		@Inject(AccountRepository) private readonly accountRepository: AccountRepository,
		@Inject(SessionRepository) private readonly sessionRepository: SessionRepository,
		@Inject(RoleRepository) private readonly roleRepository: RoleRepository,
	) {}

	public async createAccount(request: CreateAccountRequest): Promise<CreateAccountResponse> {
		try {
			const account = await this.accountRepository.create({
				email: request.email,
				login: request.login,
				passwordHash: await hash(request.password),
				roleId: 1,
			});
			return {
				accountId: account.id,
				login: request.login,
				email: account.email ?? '',
				roleId: 1,
			};
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
				const target = (error.meta?.target as string[]) ?? [];
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
		if (request.id) await this.accountRepository.delete(request.id);
	}

	public async changePassword(request: ChangePasswordRequest): Promise<void> {
		await this.accountRepository.updatePassword(request.accountId, request.newPassword);
	}

	public async changeEmail(request: ChangeEmailRequest): Promise<void> {
		await this.accountRepository.updateEmail(request.accountId, request.newEmail);
	}

	public async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
		const session = await this.sessionRepository.create({
			accountId: request.accountId,
			deviceIdentifier: request.device,
			refreshToken: randomBytes(48).toString('base64'),
			expiresAt: new Date((request.expiresAt?.seconds ?? 0) * 1000),
		});
		return {
			tokens: { accessToken: '(mock realization)', refreshToken: session.refreshToken },
			expiresAt: request.expiresAt,
			createdAt: request.createdAt,
		};
	}

	public async revokeSession(request: RevokeSessionRequest): Promise<void> {
		await this.sessionRepository.delete(request.sessionId);
	}

	public async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
		// todo
		const updated = {
			access: '',
			refresh: randomBytes(48).toString('base64'),
		};
		return { tokens: { accessToken: updated.access, refreshToken: updated.refresh } };
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
