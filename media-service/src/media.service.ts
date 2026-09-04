import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { S3ObjectNotFoundError } from '@kirillasyamov/common';
import { mediaConfig } from '@kirillasyamov/common/configs';
import { FileStatus } from '@kirillasyamov/common/contracts/generated/media';
import type {
	MediaServiceController as MediaServiceControllerInterface,
	RequestUploadUrlRequest,
	RequestUploadUrlResponse,
	GetFileMetadataRequest,
	GetFileMetadataResponse,
	GetDownloadUrlRequest,
	GetDownloadUrlResponse,
	DeleteFileRequest,
	ListFilesRequest,
	ListFilesResponse,
	FileMetadata,
} from '@kirillasyamov/common/contracts/generated/media';
import type { ListedObject } from './interfaces/s3-client.interface';
import { FILE_HANDLER, S3_BUCKET, S3_CLIENT_SERVICE, type IFileHandler, type IS3ClientService } from './interfaces';
import { STATUS_TAG, DEFAULT_LIMIT, MAX_LIMIT, LIST_MAX_KEYS } from './media.constants';
import { getPurposeNames, getPurposeProfile, isPurpose, ownsObjectKey, parseObjectKey } from './utils/object-key';

@Injectable()
export class MediaService implements MediaServiceControllerInterface {
	private readonly logger = new Logger(MediaService.name);

	constructor(
		@Inject(S3_CLIENT_SERVICE) private readonly s3: IS3ClientService,
		@Inject(S3_BUCKET) private readonly bucket: string,
		@Inject(FILE_HANDLER) private readonly handler: IFileHandler,
	) {}

	public async requestUploadUrl(request: RequestUploadUrlRequest): Promise<RequestUploadUrlResponse> {
		if (!request.ownerAccountId) throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'ownerAccountId is required' });
		if (!isPurpose(request.purpose)) throw new RpcException({ code: status.INVALID_ARGUMENT, message: `Unknown purpose: ${request.purpose}` });

		try {
			const result = await this.handler.prepareUpload({
				purpose: request.purpose,
				ownerAccountId: request.ownerAccountId,
				filename: request.filename,
				metadata: request.metadata,
				sizeBytes: request.sizeBytes,
			});
			if (!result.upload) throw new RpcException({ code: status.INTERNAL, message: 'No upload transport available' });
			return {
				key: result.key,
				url: result.upload.url,
				fields: result.upload.fields,
				expiresAt: result.upload.expiresAt,
			};
		} catch (error) {
			if (error instanceof RpcException) throw error;
			this.logger.error(`Failed to create upload url (purpose=${request.purpose})`, error instanceof Error ? error.stack : String(error));
			throw new RpcException({ code: status.INTERNAL, message: 'Failed to create upload url' });
		}
	}

	public async getFileMetadata(request: GetFileMetadataRequest): Promise<GetFileMetadataResponse> {
		this.assertOwnership(request.key, request.ownerAccountId);
		return { fileMetadata: await this.loadFileMetadata(request.key) };
	}

	public async getDownloadUrl(request: GetDownloadUrlRequest): Promise<GetDownloadUrlResponse> {
		this.assertOwnership(request.key, request.ownerAccountId);

		try {
			const expiresInSeconds = this.clampTtl(request.expiresInSeconds ?? mediaConfig.downloadUrlTtl);
			const url = await this.s3.getSignedDownloadUrl(this.bucket, request.key, expiresInSeconds);
			return { url, expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString() };
		} catch (error) {
			if (error instanceof S3ObjectNotFoundError) throw new RpcException({ code: status.NOT_FOUND, message: 'File not found' });
			this.logger.error(`Failed to create download url: key=${request.key}`, error instanceof Error ? error.stack : String(error));
			throw new RpcException({ code: status.INTERNAL, message: 'Failed to create download url' });
		}
	}

	public async deleteFile(request: DeleteFileRequest): Promise<void> {
		this.assertOwnership(request.key, request.ownerAccountId);

		try {
			await this.s3.removeFile(this.bucket, { path: request.key });
			this.logger.log(`File deleted: key=${request.key}`);
		} catch (error) {
			if (error instanceof S3ObjectNotFoundError) throw new RpcException({ code: status.NOT_FOUND, message: 'File not found' });
			this.logger.error(`Failed to delete file: key=${request.key}`, error instanceof Error ? error.stack : String(error));
			throw new RpcException({ code: status.INTERNAL, message: 'Failed to delete file' });
		}
	}

	public async listFiles(request: ListFilesRequest): Promise<ListFilesResponse> {
		if (!request.ownerAccountId) throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'ownerAccountId is required' });
		if (request.purpose !== undefined && !isPurpose(request.purpose)) {
			throw new RpcException({ code: status.INVALID_ARGUMENT, message: `Unknown purpose: ${request.purpose}` });
		}

		const limit = request.limit > 0 ? Math.min(request.limit, MAX_LIMIT) : DEFAULT_LIMIT;

		try {
			if (request.purpose !== undefined) {
				const profile = getPurposeProfile(request.purpose);
				const page = await this.s3.listObjects(this.bucket, `${profile.prefix}/${request.ownerAccountId}/`, { limit, cursor: request.cursor });
				return {
					files: page.items.map(item => this.adaptToFileMetadata(item, request.ownerAccountId)),
					nextCursor: page.nextCursor,
				};
			}

			const all: { item: ListedObject; ownerAccountId: string }[] = [];
			for (const name of getPurposeNames()) {
				const prefix = `${getPurposeProfile(name).prefix}/${request.ownerAccountId}/`;
				await this.collectAll(prefix, all, request.ownerAccountId);
			}
			all.sort((a, b) => (b.item.lastModified?.getTime() ?? 0) - (a.item.lastModified?.getTime() ?? 0));

			const start = this.decodeOffset(request.cursor);
			const page = all.slice(start, start + limit);
			return {
				files: page.map(({ item }) => this.adaptToFileMetadata(item, request.ownerAccountId)),
				nextCursor: start + page.length >= all.length ? undefined : this.encodeOffset(start + page.length),
			};
		} catch (error) {
			this.logger.error(`Failed to list files (owner=${request.ownerAccountId})`, error instanceof Error ? error.stack : String(error));
			throw new RpcException({ code: status.INTERNAL, message: 'Failed to list files' });
		}
	}

	private async collectAll(prefix: string, collected: { item: ListedObject; ownerAccountId: string }[], ownerAccountId: string): Promise<void> {
		let pageCursor: string | undefined = undefined;
		do {
			const page = await this.s3.listObjects(this.bucket, prefix, { limit: LIST_MAX_KEYS, cursor: pageCursor });
			collected.push(...page.items.map(item => ({ item, ownerAccountId })));
			pageCursor = page.nextCursor;
		} while (pageCursor);
	}

	private adaptToFileMetadata(object: ListedObject, ownerAccountId: string): FileMetadata {
		return {
			key: object.key,
			ownerAccountId,
			mimeType: '',
			sizeBytes: object.sizeBytes,
			originalFilename: undefined,
			status: FileStatus.FILE_STATUS_PENDING,
			createdAt: object.lastModified?.toISOString() ?? '',
		};
	}

	private async loadFileMetadata(key: string): Promise<FileMetadata> {
		const parsed = parseObjectKey(key);
		let head;
		try {
			head = await this.s3.headObject(this.bucket, key);
		} catch (error) {
			if (error instanceof S3ObjectNotFoundError) throw new RpcException({ code: status.NOT_FOUND, message: 'File not found' });
			this.logger.error(`Failed to load file metadata: key=${key}`, error instanceof Error ? error.stack : String(error));
			throw new RpcException({ code: status.INTERNAL, message: 'Failed to load file metadata' });
		}

		const tags = await this.s3.getObjectTags(this.bucket, key);
		const statusTag = tags[STATUS_TAG];

		return {
			key,
			ownerAccountId: parsed?.ownerAccountId ?? '',
			mimeType: head.contentType ?? '',
			sizeBytes: head.contentLength ?? 0,
			originalFilename: head.metadata?.['original-filename'],
			status: this.mapStatusTag(statusTag),
			createdAt: head.lastModified?.toISOString() ?? '',
		};
	}

	private mapStatusTag(value: string | undefined): FileStatus {
		switch (value) {
			case 'confirmed':
				return FileStatus.FILE_STATUS_CONFIRMED;
			case 'rejected':
				return FileStatus.FILE_STATUS_REJECTED;
			default:
				return FileStatus.FILE_STATUS_PENDING;
		}
	}

	private assertOwnership(key: string, ownerAccountId: string): void {
		if (!ownsObjectKey(key, ownerAccountId)) {
			throw new RpcException({ code: status.PERMISSION_DENIED, message: 'Access to the file is denied' });
		}
	}

	private clampTtl(seconds: number): number {
		return Math.min(Math.max(seconds, 60), mediaConfig.maxUrlTtl);
	}

	private decodeOffset(cursor: string | undefined): number {
		if (!cursor) return 0;
		try {
			const value = Number(Buffer.from(cursor, 'base64').toString('utf8'));
			return Number.isInteger(value) && value >= 0 ? value : 0;
		} catch {
			return 0;
		}
	}

	private encodeOffset(offset: number): string {
		return Buffer.from(String(offset), 'utf8').toString('base64');
	}
}
