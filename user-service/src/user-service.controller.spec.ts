import { Test } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import { UserController } from './user-service.controller';
import { UserService } from './user-service.service';
import { AvatarStatus, type SetAvatarStatusRequest } from '@kirillasyamov/common/contracts/generated/user';

describe('UserController', () => {
	let controller: UserController;
	let userService: ReturnType<typeof mockDeep<UserService>>;

	beforeEach(async () => {
		userService = mockDeep<UserService>();
		const moduleRef = await Test.createTestingModule({
			controllers: [UserController],
			providers: [{ provide: UserService, useValue: userService }],
		}).compile();
		controller = moduleRef.get(UserController);
	});

	it('setAvatarStatus delegates to UserService.setAvatarStatus', async () => {
		const request: SetAvatarStatusRequest = { mediaKey: 'avatar/usr_1/f', status: AvatarStatus.AVATAR_STATUS_ACTIVE, mimeType: 'image/png' };
		userService.setAvatarStatus.mockResolvedValue(undefined);

		await expect(controller.setAvatarStatus(request)).resolves.toBeUndefined();

		expect(userService.setAvatarStatus).toHaveBeenCalledWith(request);
	});

	it('uploadAvatar delegates to UserService.uploadAvatar', async () => {
		userService.uploadAvatar.mockResolvedValue({ avatarId: 'av_1', mediaKey: 'avatar/usr_1/f' });

		await expect(controller.uploadAvatar({ login: 'alice', mediaKey: 'avatar/usr_1/f' })).resolves.toEqual({ avatarId: 'av_1', mediaKey: 'avatar/usr_1/f' });
	});
});
