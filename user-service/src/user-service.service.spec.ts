import { Test } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import { status } from '@grpc/grpc-js';
import { UserService } from './user-service.service';
import { UserRepository } from './repositories';
import { BALANCE_RESET_QUEUE } from './user-service.constants';
import { vi } from 'vitest';
import { getQueueToken } from '@nestjs/bullmq';
import { SchedulerRegistry } from '@nestjs/schedule/dist/scheduler.registry';

describe('UserService', () => {
	let service: UserService;
	let userRepository: ReturnType<typeof mockDeep<UserRepository>>;

	beforeEach(async () => {
		userRepository = mockDeep<UserRepository>();
		const moduleRef = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: UserRepository, useValue: userRepository },
				{ provide: SchedulerRegistry, useValue: { deleteInterval: vi.fn(), addInterval: vi.fn() } },
				{ provide: getQueueToken(BALANCE_RESET_QUEUE), useValue: { add: vi.fn().mockResolvedValue(undefined) } },
			],
		}).compile();
		service = moduleRef.get(UserService);
	});

	it('getUser throws NOT_FOUND when user missing', async () => {
		userRepository.findByLogin.mockResolvedValue(null);

		await expect(service.getUser({ login: 'ghost' })).rejects.toMatchObject({
			error: { code: status.NOT_FOUND, message: 'User not found' },
		});
		expect(userRepository.findByLogin).toHaveBeenCalledWith('ghost');
	});

	it('getUsers returns mapped users with pagination defaults', async () => {
		userRepository.findAll.mockResolvedValue({
			users: [{ login: 'alice', email: 'a@b.com', age: 30, bio: 'hi', balance: { toFixed: () => '0.00' } } as never],
			total: 1,
		});

		const result = await service.getUsers({ page: 0, limit: 0 });

		expect(userRepository.findAll).toHaveBeenCalledWith(1, 10);
		expect(result).toEqual({
			users: [{ login: 'alice', email: 'a@b.com', age: 30, bio: 'hi', balance: '0.00' }],
			total: 1,
			page: 1,
			limit: 10,
		});
	});
});
