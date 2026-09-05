import { Test } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import { status } from '@grpc/grpc-js';
import { UserService } from './user-service.service';
import { UserRepository, AvatarRepository } from './repositories';
import { BALANCE_RESET_QUEUE, MAX_ACTIVE_AVATARS } from './user-service.constants';
import { vi } from 'vitest';
import { getQueueToken } from '@nestjs/bullmq';
import { SchedulerRegistry } from '@nestjs/schedule/dist/scheduler.registry';
import { Prisma } from '@prismagen/client';

describe('UserService', () => {
	let service: UserService;
	let userRepository: ReturnType<typeof mockDeep<UserRepository>>;
	let avatarRepository: ReturnType<typeof mockDeep<AvatarRepository>>;

	beforeEach(async () => {
		userRepository = mockDeep<UserRepository>();
		avatarRepository = mockDeep<AvatarRepository>();
		const moduleRef = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: UserRepository, useValue: userRepository },
				{ provide: AvatarRepository, useValue: avatarRepository },
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

	it('getUser returns profile with active avatar media keys', async () => {
		userRepository.findByLogin.mockResolvedValue({ id: 'usr_1', login: 'alice', email: 'a@b.com', age: 30, bio: 'hi', balance: { toFixed: () => '5.00' } } as never);
		avatarRepository.findActiveMediaKeysByUserId.mockResolvedValue(['avatar/usr_1/f1', 'avatar/usr_1/f2']);

		const result = await service.getUser({ login: 'alice' });

		expect(avatarRepository.findActiveMediaKeysByUserId).toHaveBeenCalledWith('usr_1');
		expect(result).toEqual({
			userProfile: { login: 'alice', email: 'a@b.com', age: 30, bio: 'hi', balance: '5.00', avatars: ['avatar/usr_1/f1', 'avatar/usr_1/f2'] },
		});
	});

	it('getUsers returns mapped users with pagination defaults', async () => {
		userRepository.findAll.mockResolvedValue({
			users: [{ id: 'usr_1', login: 'alice', email: 'a@b.com', age: 30, bio: 'hi', balance: { toFixed: () => '0.00' } } as never],
			total: 1,
		});
		avatarRepository.findActiveMediaKeysByUserIds.mockResolvedValue(new Map([['usr_1', ['avatar/usr_1/f']]]));

		const result = await service.getUsers({ page: 0, limit: 0 });

		expect(userRepository.findAll).toHaveBeenCalledWith(1, 10);
		expect(avatarRepository.findActiveMediaKeysByUserIds).toHaveBeenCalledWith(['usr_1']);
		expect(result).toEqual({
			users: [{ login: 'alice', email: 'a@b.com', age: 30, bio: 'hi', balance: '0.00', avatars: ['avatar/usr_1/f'] }],
			total: 1,
			page: 1,
			limit: 10,
		});
	});

	it('uploadAvatar rejects when active limit reached', async () => {
		userRepository.findByLogin.mockResolvedValue({ id: 'usr_1' } as never);
		avatarRepository.countActiveByUser.mockResolvedValue(MAX_ACTIVE_AVATARS);

		await expect(service.uploadAvatar({ login: 'usr_1', mediaKey: 'avatar/usr_1/f' })).rejects.toMatchObject({
			error: { code: status.RESOURCE_EXHAUSTED },
		});
		expect(avatarRepository.create).not.toHaveBeenCalled();
	});

	it('uploadAvatar registers avatar when under limit', async () => {
		userRepository.findByLogin.mockResolvedValue({ id: 'usr_1' } as never);
		avatarRepository.countActiveByUser.mockResolvedValue(2);
		avatarRepository.create.mockResolvedValue({ id: 'av_1', mediaKey: 'avatar/usr_1/f' });

		const result = await service.uploadAvatar({ login: 'usr_1', mediaKey: 'avatar/usr_1/f' });

		expect(userRepository.findByLogin).toHaveBeenCalledWith('usr_1');
		expect(avatarRepository.create).toHaveBeenCalledWith('usr_1', { mediaKey: 'avatar/usr_1/f', fileName: undefined, sizeBytes: undefined });
		expect(result).toEqual({ avatarId: 'av_1', mediaKey: 'avatar/usr_1/f' });
	});

	it('deleteAvatar throws NOT_FOUND when user missing', async () => {
		userRepository.findByLogin.mockResolvedValue(null);

		await expect(service.deleteAvatar({ login: 'ghost', avatarId: 'av_1' })).rejects.toMatchObject({
			error: { code: status.NOT_FOUND, message: 'User not found' },
		});
		expect(avatarRepository.softDelete).not.toHaveBeenCalled();
	});

	it('deleteAvatar throws NOT_FOUND when avatar not owned', async () => {
		userRepository.findByLogin.mockResolvedValue({ id: 'usr_1' } as never);
		avatarRepository.findOwnedById.mockResolvedValue(null);

		await expect(service.deleteAvatar({ login: 'usr_1', avatarId: 'av_1' })).rejects.toMatchObject({
			error: { code: status.NOT_FOUND, message: 'Avatar not found' },
		});
		expect(avatarRepository.softDelete).not.toHaveBeenCalled();
	});

	it('deleteAvatar soft-deletes owned avatar', async () => {
		userRepository.findByLogin.mockResolvedValue({ id: 'usr_1' } as never);
		avatarRepository.findOwnedById.mockResolvedValue({ userId: 'usr_1', isActive: true });

		await service.deleteAvatar({ login: 'usr_1', avatarId: 'av_1' });

		expect(avatarRepository.findOwnedById).toHaveBeenCalledWith('usr_1', 'av_1');
		expect(avatarRepository.softDelete).toHaveBeenCalledWith('av_1');
	});

	it('getMostActiveUsers maps rows with latest avatar', async () => {
		avatarRepository.findMostActiveUsers.mockResolvedValue({
			users: [
				{
					id: 'usr_1',
					login: 'alice',
					email: 'a@b.com',
					age: 30,
					bio: 'hi',
					balance: new Prisma.Decimal('5.00'),
					avatarId: 'av_1',
					avatarMediaKey: 'avatar/usr_1/f',
					avatarMimeType: 'image/png',
					avatarCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
				},
			],
			total: 1,
		});

		const result = await service.getMostActiveUsers({ minAge: 20, maxAge: 40, page: 1, limit: 10 });

		expect(avatarRepository.findMostActiveUsers).toHaveBeenCalledWith({ minAge: 20, maxAge: 40, page: 1, limit: 10 });
		expect(result.users[0]?.profile).toEqual({ login: 'alice', email: 'a@b.com', age: 30, bio: 'hi', balance: '5.00', avatars: [] });
		expect(result.users[0]?.latestAvatar).toEqual({
			avatarId: 'av_1',
			mediaKey: 'avatar/usr_1/f',
			mimeType: 'image/png',
			createdAt: '2026-01-01T00:00:00.000Z',
		});
	});
});
