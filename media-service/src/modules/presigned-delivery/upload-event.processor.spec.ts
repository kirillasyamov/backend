import { Test } from '@nestjs/testing';
import { type ClientGrpc } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LISTEN_EVENTS, type IListenEvents } from '../s3-events-listening';
import { FILE_HANDLER, type VerifyUploadResult } from '../../interfaces';
import { USER_PACKAGE } from '../../media.constants';
import { AvatarStatus, type UserServiceClient } from '@kirillasyamov/common/contracts/generated/user';
import { UploadEventProcessor } from './upload-event.processor';

describe('UploadEventProcessor', () => {
	let processor: UploadEventProcessor;
	let setAvatarStatus: ReturnType<typeof vi.fn>;
	let verifyUpload: ReturnType<typeof vi.fn>;
	let uploadHandler: (event: { fileKey: string }) => Promise<void>;

	const listenMock: IListenEvents = {
		onUpload: vi.fn((cb: (event: { fileKey: string }) => Promise<void>) => {
			uploadHandler = cb;
		}),
	};

	const setupVerify = (result: VerifyUploadResult): void => {
		verifyUpload.mockResolvedValue(result);
	};

	beforeEach(async () => {
		setAvatarStatus = vi.fn(() => of({}));
		verifyUpload = vi.fn();
		const userClient = {
			getService: vi.fn(() => ({ setAvatarStatus }) as unknown as UserServiceClient),
		} as unknown as ClientGrpc;

		const moduleRef = await Test.createTestingModule({
			providers: [
				UploadEventProcessor,
				{ provide: LISTEN_EVENTS, useValue: listenMock },
				{ provide: FILE_HANDLER, useValue: { verifyUpload, prepareUpload: vi.fn() } },
				{ provide: USER_PACKAGE, useValue: userClient },
			],
		}).compile();

		processor = moduleRef.get(UploadEventProcessor);
		processor.onModuleInit();
	});

	it('reports ACTIVE with the sniffed mime type when an avatar upload is confirmed', async () => {
		setupVerify({ confirmed: true, mimeType: 'image/png' });

		await uploadHandler({ fileKey: 'avatar/acc_1/file_1' });

		expect(setAvatarStatus).toHaveBeenCalledWith({ mediaKey: 'avatar/acc_1/file_1', status: AvatarStatus.AVATAR_STATUS_ACTIVE, mimeType: 'image/png' });
	});

	it('reports REJECTED when an avatar upload is confirmed=false with a reported mime type', async () => {
		setupVerify({ confirmed: false, mimeType: 'application/x-msdownload', reason: 'mime "application/x-msdownload" is not allowed' });

		await uploadHandler({ fileKey: 'avatar/acc_1/file_2' });

		expect(setAvatarStatus).toHaveBeenCalledWith({
			mediaKey: 'avatar/acc_1/file_2',
			status: AvatarStatus.AVATAR_STATUS_REJECTED,
			mimeType: 'application/x-msdownload',
		});
	});

	it('reports REJECTED for an avatar key whose object is missing, without a mime type', async () => {
		setupVerify({ confirmed: false, mimeType: null, reason: 'object not found' });

		await uploadHandler({ fileKey: 'avatar/acc_1/file_3' });

		expect(setAvatarStatus).toHaveBeenCalledWith({ mediaKey: 'avatar/acc_1/file_3', status: AvatarStatus.AVATAR_STATUS_REJECTED, mimeType: undefined });
	});

	it('does not call user-service for keys outside the avatar purpose', async () => {
		setupVerify({ confirmed: false, mimeType: null, reason: 'unknown purpose' });

		await uploadHandler({ fileKey: 'documents/acc_1/file_4' });

		expect(setAvatarStatus).not.toHaveBeenCalled();
	});

	it('does not call user-service for malformed keys', async () => {
		setupVerify({ confirmed: false, mimeType: null, reason: 'unknown purpose' });

		await uploadHandler({ fileKey: 'not-a-key' });

		expect(setAvatarStatus).not.toHaveBeenCalled();
	});

	it('swallows user-service failures and still completes the verification flow', async () => {
		verifyUpload.mockResolvedValue({ confirmed: true, mimeType: 'image/jpeg' });
		setAvatarStatus.mockReturnValue(throwError(() => new Error('user-service unreachable')));

		await expect(uploadHandler({ fileKey: 'avatar/acc_1/file_5' })).resolves.toBeUndefined();
		expect(setAvatarStatus).toHaveBeenCalledTimes(1);
	});
});
