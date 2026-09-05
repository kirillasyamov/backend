import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { S3ObjectNotFoundError } from '@kirillasyamov/common';
import { mediaConfig } from '@kirillasyamov/common/configs';
import {
	S3_BUCKET,
	S3_CLIENT_SERVICE,
	type IFileHandler,
	type IS3ClientService,
	type FileHandlerPrepareParams,
	type FileHandlerPrepareResult,
	type VerifyUploadParams,
	type VerifyUploadResult,
} from '../../interfaces';
import { STATUS_TAG, STATUS_TAG_VALUES, SIGNATURE_SNIFF_BYTES } from '../../media.constants';
import { sniffMime } from '../../utils/mime-sniff';
import { buildObjectKey, findPurposeByPrefix, getPurposeProfile, isPurpose, parseObjectKey } from '../../utils/object-key';

const MIN_URL_TTL_SECONDS = 60;

@Injectable()
export class PresignedFileHandler implements IFileHandler {
	private readonly logger = new Logger(PresignedFileHandler.name);

	constructor(
		@Inject(S3_CLIENT_SERVICE) private readonly s3: IS3ClientService,
		@Inject(S3_BUCKET) private readonly bucket: string,
	) {}

	async prepareUpload(params: FileHandlerPrepareParams): Promise<FileHandlerPrepareResult> {
		if (!isPurpose(params.purpose)) throw new Error(`Unknown purpose: ${params.purpose}`);
		const profile = getPurposeProfile(params.purpose);
		const fileId = randomUUID();
		const key = buildObjectKey(profile, params.ownerAccountId, fileId);

		const expiresInSeconds = this.clampTtl(mediaConfig.uploadUrlTtl);
		const upload = await this.s3.createPresignedUpload(this.bucket, {
			key,
			expiresInSeconds,
			maxSizeBytes: profile.maxSizeBytes,
			allowedMimeTypes: profile.allowedMimes,
			metadata: {
				...(params.filename ? { 'original-filename': params.filename } : {}),
				...(params.metadata ?? {}),
			},
		});

		this.logger.log(`Upload prepared: key=${key}`);
		return { key, upload: { url: upload.url, fields: upload.fields, expiresAt: upload.expiresAt } };
	}

	async verifyUpload({ key }: VerifyUploadParams): Promise<VerifyUploadResult> {
		const parsed = parseObjectKey(key);
		const purpose = parsed ? findPurposeByPrefix(parsed.prefix) : undefined;
		if (!purpose) {
			this.logger.warn(`Skipping event for key outside of known purposes: key=${key}`);
			return { confirmed: false, mimeType: null, reason: 'unknown purpose' };
		}
		const profile = getPurposeProfile(purpose);

		try {
			await this.s3.headObject(this.bucket, key);
		} catch (error) {
			if (error instanceof S3ObjectNotFoundError) {
				this.logger.warn(`Object not reachable, skip verification: key=${key}`);
				return { confirmed: false, mimeType: null, reason: 'object not found' };
			}
			throw error;
		}

		const mimeType = await this.sniffMimeType(key).catch((error: unknown) => {
			this.logger.error(`Failed to read object for signature sniffing: key=${key}`, error instanceof Error ? error.stack : String(error));
			return null;
		});

		const confirmed = mimeType !== null && profile.allowedMimes.includes(mimeType);

		await this.s3.putObjectTagging(this.bucket, key, {
			[STATUS_TAG]: confirmed ? STATUS_TAG_VALUES.CONFIRMED : STATUS_TAG_VALUES.REJECTED,
		});

		this.logger[confirmed ? 'log' : 'warn'](`Upload verified: key=${key} mime=${mimeType ?? 'unknown'} confirmed=${String(confirmed)}`);
		return { confirmed, mimeType, reason: confirmed ? undefined : mimeType === null ? 'unrecognized file signature' : `mime "${mimeType}" is not allowed` };
	}

	private async sniffMimeType(key: string): Promise<string | null> {
		const response = await this.s3.getObject(this.bucket, key, `bytes=0-${String(SIGNATURE_SNIFF_BYTES - 1)}`);
		try {
			const head = await response.body.transformToByteArray();
			return sniffMime(head.slice(0, SIGNATURE_SNIFF_BYTES));
		} finally {
			response.body.destroy?.();
		}
	}

	private clampTtl(seconds: number): number {
		return Math.min(Math.max(seconds, MIN_URL_TTL_SECONDS), mediaConfig.maxUrlTtl);
	}
}
