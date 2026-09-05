import { Test } from '@nestjs/testing';
import { type RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { mockDeep } from 'vitest-mock-extended';
import { S3ObjectNotFoundError } from '@kirillasyamov/common';
import type { IS3ClientService, IFileHandler } from './interfaces';
import { FILE_HANDLER, S3_BUCKET, S3_CLIENT_SERVICE } from './interfaces';
import { MediaService } from './media.service';
import { FileStatus } from '@kirillasyamov/common/contracts/generated/media';

const rpcCodeOf = (error: unknown): number => {
	const code = (error as RpcException).getError();
	return (code as { code: number }).code;
};

const rejectionOf = async (promise: Promise<unknown>): Promise<RpcException> => {
	try {
		await promise;
	} catch (error) {
		return error as RpcException;
	}
	throw new Error('Expected the promise to reject');
};

describe('MediaService', () => {
	let service: MediaService;
	let s3: ReturnType<typeof mockDeep<IS3ClientService>>;
	let handler: ReturnType<typeof mockDeep<IFileHandler>>;

	beforeEach(async () => {
		s3 = mockDeep<IS3ClientService>();
		handler = mockDeep<IFileHandler>();
		handler.prepareUpload.mockResolvedValue({
			key: 'avatar/account-1/file-2',
			upload: { url: 'http://minio/upload', fields: { key: 'avatar/account-1/file-2' }, expiresAt: '2026-01-01T00:00:00.000Z' },
		});

		const moduleRef = await Test.createTestingModule({
			providers: [MediaService, { provide: S3_CLIENT_SERVICE, useValue: s3 }, { provide: S3_BUCKET, useValue: 'media' }, { provide: FILE_HANDLER, useValue: handler }],
		}).compile();
		service = moduleRef.get(MediaService);
	});

	describe('requestUploadUrl', () => {
		it('rejects an empty ownerAccountId', async () => {
			const error = await rejectionOf(service.requestUploadUrl({ purpose: 'avatar', ownerAccountId: '', metadata: {} }));
			expect(rpcCodeOf(error)).toBe(status.INVALID_ARGUMENT);
		});

		it('rejects an unknown purpose', async () => {
			const error = await rejectionOf(service.requestUploadUrl({ purpose: 'documents', ownerAccountId: 'account-1', metadata: {} }));
			expect(rpcCodeOf(error)).toBe(status.INVALID_ARGUMENT);
		});

		it('delegates to the file handler and maps the transport packet', async () => {
			const result = await service.requestUploadUrl({ purpose: 'avatar', ownerAccountId: 'account-1', metadata: {} });

			expect(handler.prepareUpload).toHaveBeenCalledWith({
				purpose: 'avatar',
				ownerAccountId: 'account-1',
				filename: undefined,
				metadata: {},
				sizeBytes: undefined,
			});
			expect(result).toEqual({
				key: 'avatar/account-1/file-2',
				url: 'http://minio/upload',
				fields: { key: 'avatar/account-1/file-2' },
				expiresAt: '2026-01-01T00:00:00.000Z',
			});
		});
	});

	describe('ownership guard', () => {
		it('denies metadata for a foreign key', async () => {
			const error = await rejectionOf(service.getFileMetadata({ key: 'avatar/other-account/file-2', ownerAccountId: 'account-1' }));
			expect(rpcCodeOf(error)).toBe(status.PERMISSION_DENIED);
		});

		it('denies download url for a foreign key', async () => {
			const error = await rejectionOf(service.getDownloadUrl({ key: 'avatar/other-account/file-2', ownerAccountId: 'account-1' }));
			expect(rpcCodeOf(error)).toBe(status.PERMISSION_DENIED);
		});
	});

	describe('getFileMetadata', () => {
		it('maps status tag to CONFIRMED', async () => {
			s3.headObject.mockResolvedValue({ contentType: 'image/png', contentLength: 42, lastModified: new Date('2026-01-01'), metadata: { 'original-filename': 'a.png' } });
			s3.getObjectTags.mockResolvedValue({ status: 'confirmed' });

			const { fileMetadata } = await service.getFileMetadata({ key: 'avatar/account-1/file-2', ownerAccountId: 'account-1' });

			expect(fileMetadata).toMatchObject({
				key: 'avatar/account-1/file-2',
				ownerAccountId: 'account-1',
				mimeType: 'image/png',
				sizeBytes: 42,
				originalFilename: 'a.png',
				status: FileStatus.FILE_STATUS_CONFIRMED,
			});
		});

		it('maps missing status tag to PENDING', async () => {
			s3.headObject.mockResolvedValue({ lastModified: new Date('2026-01-01') });
			s3.getObjectTags.mockResolvedValue({});

			const { fileMetadata } = await service.getFileMetadata({ key: 'avatar/account-1/file-2', ownerAccountId: 'account-1' });

			expect(fileMetadata?.status).toBe(FileStatus.FILE_STATUS_PENDING);
		});

		it('maps object-not-found to NOT_FOUND', async () => {
			s3.headObject.mockRejectedValue(new S3ObjectNotFoundError('missing', 'media', 'avatar/account-1/file-2'));

			const error = await rejectionOf(service.getFileMetadata({ key: 'avatar/account-1/file-2', ownerAccountId: 'account-1' }));

			expect(rpcCodeOf(error)).toBe(status.NOT_FOUND);
		});
	});
});
