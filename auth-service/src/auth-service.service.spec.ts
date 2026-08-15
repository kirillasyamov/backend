import { Test } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import { status } from '@grpc/grpc-js';
import { of } from 'rxjs';
import { AuthService } from './auth-service.service';
import { AccountRepository } from './account.repository';
import { SessionRepository } from './session.repository';
import { RoleRepository } from './role.repository';
import type { TokenServiceClient } from '@kirillasyamov/common/contracts/generated/token';

vi.mock('@node-rs/argon2', () => ({ hash: vi.fn().mockResolvedValue('hashed-pw'), verify: vi.fn() }));

describe('AuthService', () => {
	let service: AuthService;
	let accountRepository: ReturnType<typeof mockDeep<AccountRepository>>;
	let sessionRepository: ReturnType<typeof mockDeep<SessionRepository>>;
	let tokenService: ReturnType<typeof mockDeep<TokenServiceClient>>;

	beforeEach(async () => {
		accountRepository = mockDeep<AccountRepository>();
		sessionRepository = mockDeep<SessionRepository>();
		tokenService = mockDeep<TokenServiceClient>();
		const moduleRef = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: AccountRepository, useValue: accountRepository },
				{ provide: SessionRepository, useValue: sessionRepository },
				{ provide: RoleRepository, useValue: mockDeep<RoleRepository>() },
				{ provide: 'TOKEN_PACKAGE', useValue: { getService: () => tokenService } },
			],
		}).compile();
		service = moduleRef.get(AuthService);
		service.onModuleInit();
	});

	it('createAccount creates account and returns response', async () => {
		accountRepository.create.mockResolvedValue({ id: 'acc-1', email: 'a@b.com', login: 'alice', passwordHash: 'hashed-pw', roleId: 1 } as never);

		const result = await service.createAccount({ email: 'a@b.com', login: 'alice', password: 'pw' });

		expect(accountRepository.create).toHaveBeenCalledOnce();
		expect(result).toEqual({ accountId: 'acc-1', login: 'alice', email: 'a@b.com', roleId: 1 });
	});

	it('getAccountByLogin throws NOT_FOUND when account missing', async () => {
		accountRepository.findByLogin.mockResolvedValue(null);

		await expect(service.getAccountByLogin({ login: 'ghost' })).rejects.toMatchObject({
			error: { code: status.NOT_FOUND, message: 'Account not found' },
		});
		expect(accountRepository.findByLogin).toHaveBeenCalledWith('ghost');
	});

	it('refreshSession throws UNAUTHENTICATED when rotate returns null', async () => {
		sessionRepository.rotate.mockResolvedValue(null);
		sessionRepository.deleteExpiredTokens.mockResolvedValue(0);

		await expect(service.refreshSession({ refreshToken: 'invalid-token' })).rejects.toMatchObject({
			error: { code: status.UNAUTHENTICATED, message: 'Invalid refresh token' },
		});
		expect(sessionRepository.rotate).toHaveBeenCalledOnce();
		expect(sessionRepository.deleteExpiredTokens).toHaveBeenCalledWith('invalid-token');
	});

	it('refreshSession deletes expired token and throws when it is expired', async () => {
		sessionRepository.rotate.mockResolvedValue(null);
		sessionRepository.deleteExpiredTokens.mockResolvedValue(1);

		await expect(service.refreshSession({ refreshToken: 'expired-token' })).rejects.toMatchObject({
			error: { code: status.UNAUTHENTICATED, message: 'Refresh token expired' },
		});
		expect(sessionRepository.deleteExpiredTokens).toHaveBeenCalledWith('expired-token');
	});

	it('refreshSession rotates token and returns new token pair', async () => {
		sessionRepository.rotate.mockResolvedValue({
			id: 'session-1',
			accountId: 'acc-1',
			deviceIdentifier: 'device',
			refreshToken: 'new-refresh-token',
			expiresAt: new Date(),
			createdAt: new Date(),
		});
		accountRepository.findById.mockResolvedValue(null);
		tokenService.generateJwt.mockReturnValue(of({ jsonWebToken: 'access-token' }));

		const result = await service.refreshSession({ refreshToken: 'old-refresh-token' });

		expect(sessionRepository.rotate).toHaveBeenCalledWith('old-refresh-token', {
			refreshToken: expect.any(String),
			expiresAt: expect.any(Date),
		});
		expect(tokenService.generateJwt).toHaveBeenCalledWith({
			sub: 'acc-1',
			aud: 'api-gateway',
			extraClaims: { sid: 'session-1', role: 'user' },
			ttlSeconds: expect.any(Number),
		});
		expect(result).toEqual({ tokens: { accessToken: 'access-token', refreshToken: 'new-refresh-token' } });
	});
});
