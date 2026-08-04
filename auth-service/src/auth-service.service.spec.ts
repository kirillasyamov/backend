import { Test } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import { status } from '@grpc/grpc-js';
import { AuthService } from './auth-service.service';
import { AccountRepository } from './account.repository';
import { SessionRepository } from './session.repository';
import { RoleRepository } from './role.repository';
import type { TokenServiceClient } from '@kirillasyamov/common/contracts/generated/token';

vi.mock('@node-rs/argon2', () => ({ hash: vi.fn().mockResolvedValue('hashed-pw'), verify: vi.fn() }));

describe('AuthService', () => {
	let service: AuthService;
	let accountRepository: ReturnType<typeof mockDeep<AccountRepository>>;

	beforeEach(async () => {
		accountRepository = mockDeep<AccountRepository>();
		const moduleRef = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: AccountRepository, useValue: accountRepository },
				{ provide: SessionRepository, useValue: mockDeep<SessionRepository>() },
				{ provide: RoleRepository, useValue: mockDeep<RoleRepository>() },
				{ provide: 'TOKEN_PACKAGE', useValue: { getService: () => mockDeep<TokenServiceClient>() } },
			],
		}).compile();
		service = moduleRef.get(AuthService);
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
});
