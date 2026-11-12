import { DeleteObjectCommand, GetObjectCommand, GetObjectTaggingCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectTaggingCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import type { PresignedPostOptions } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';

import type { GetObjectOutput, HeadObjectOutput, ListedObjectsOptions, ListedPage, PresignedUploadOptions, PresignedUploadResult, RemoveFilePayload } from './interfaces';
import { DEFAULT_LIST_PAGE_SIZE, DEFAULT_PRESIGNED_URL_TTL_SECONDS } from './s3-client.constants';
import { S3_CLIENT } from './s3-client.tokens';
import { s3ErrorMapper } from './utils';

@Injectable()
export class S3ClientService implements OnModuleDestroy {
	private readonly logger = new Logger(S3ClientService.name);

	constructor(@Inject(S3_CLIENT) private readonly client: S3Client) {}

	async removeFile(bucket: string, payload: RemoveFilePayload): Promise<void> {
		try {
			this.logger.log(`Removing file from "${bucket}": ${payload.path}`);
			await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: payload.path }));
		} catch (error) {
			this.rethrow('removeFile', `${bucket}/${payload.path}`, [bucket, payload], error);
		}
	}

	async createPresignedUpload(bucket: string, opts: PresignedUploadOptions): Promise<PresignedUploadResult> {
		try {
			const { key, metadata = {}, expiresInSeconds } = opts;

			this.logger.log(`Creating presigned upload for "${bucket}/${key}" (expires in ${String(expiresInSeconds)}s)`);

			const fields = Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`x-amz-meta-${k}`, v]));

			const conditions: PresignedPostOptions['Conditions'] = Object.entries(metadata).map(([k, v]) => ({ [`x-amz-meta-${k}`]: v }));
			if (opts.maxSizeBytes) conditions.push(['content-length-range', 1, opts.maxSizeBytes]);
			if (opts.allowedMimeTypes?.length) conditions.push(['starts-with', '$Content-Type', this.commonMimePrefix(opts.allowedMimeTypes)]);

			const { url, fields: postFields } = await createPresignedPost(this.client, {
				Bucket: bucket,
				Key: key,
				Conditions: conditions,
				Fields: fields,
				Expires: expiresInSeconds,
			});

			return { url, fields: postFields, expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString() };
		} catch (error) {
			this.rethrow('createPresignedUpload', `${bucket}/${opts.key}`, [bucket, opts], error);
		}
	}

	async getSignedDownloadUrl(bucket: string, key: string, expiresIn = DEFAULT_PRESIGNED_URL_TTL_SECONDS): Promise<string> {
		try {
			this.logger.log(`Signing download url for "${bucket}/${key}" (expires in ${String(expiresIn)}s)`);
			return await getSignedUrl(this.client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
		} catch (error) {
			this.rethrow('getSignedDownloadUrl', `${bucket}/${key}`, [bucket, key, expiresIn], error);
		}
	}

	async headObject(bucket: string, key: string): Promise<HeadObjectOutput> {
		try {
			const output = await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
			return { contentType: output.ContentType, contentLength: output.ContentLength, lastModified: output.LastModified, metadata: output.Metadata };
		} catch (error) {
			this.rethrow('headObject', `${bucket}/${key}`, [bucket, key], error);
		}
	}

	async getObject(bucket: string, key: string, range?: string): Promise<GetObjectOutput> {
		try {
			const { Body, ContentType, ContentLength } = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: range }));
			if (!Body) throw new Error(`Object "${bucket}/${key}" returned no body`);

			return {
				body: {
					transformToByteArray: async () => Body.transformToByteArray(),
					destroy: () => (Body as { destroy?: () => void }).destroy?.(),
				},
				contentType: ContentType,
				contentLength: ContentLength,
			};
		} catch (error) {
			this.rethrow('getObject', `${bucket}/${key}`, [bucket, key, range], error);
		}
	}

	async getObjectTags(bucket: string, key: string): Promise<Record<string, string>> {
		try {
			const { TagSet = [] } = await this.client.send(new GetObjectTaggingCommand({ Bucket: bucket, Key: key }));
			return Object.fromEntries(TagSet.map(({ Key, Value }) => [Key, Value])) as Record<string, string>;
		} catch (error) {
			this.rethrow('getObjectTags', `${bucket}/${key}`, [bucket, key], error);
		}
	}

	async putObjectTagging(bucket: string, key: string, tags: Record<string, string>): Promise<void> {
		try {
			const TagSet = Object.entries(tags).map(([Key, Value]) => ({ Key, Value }));
			await this.client.send(new PutObjectTaggingCommand({ Bucket: bucket, Key: key, Tagging: { TagSet } }));
		} catch (error) {
			this.rethrow('putObjectTagging', `${bucket}/${key}`, [bucket, key, tags], error);
		}
	}

	async listObjects(bucket: string, prefix: string, { limit = DEFAULT_LIST_PAGE_SIZE, cursor }: ListedObjectsOptions = {}): Promise<ListedPage> {
		try {
			const output = await this.client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: limit, ContinuationToken: cursor }));

			return {
				items: (output.Contents ?? []).map(({ Key = '', Size = 0, LastModified }) => ({ key: Key, sizeBytes: Size, lastModified: LastModified })),
				nextCursor: output.IsTruncated ? output.NextContinuationToken : undefined,
			};
		} catch (error) {
			this.rethrow('listObjects', `${bucket}/${prefix}`, [bucket, prefix, { limit, cursor }], error);
		}
	}

	onModuleDestroy(): void {
		this.client.destroy();
	}

	private rethrow(operation: string, context: string, args: [bucket: string, ...rest: unknown[]], error: unknown): never {
		const mapped = s3ErrorMapper(error, { operation, context, args, instance: this });
		throw mapped;
	}

	private commonMimePrefix(mimeTypes: readonly string[]): string {
		if (mimeTypes.length <= 1) return mimeTypes[0] ?? '';

		const sorted = [...mimeTypes].sort();
		const first = sorted[0] ?? '';
		const last = sorted[sorted.length - 1] ?? '';
		let i = 0;
		while (i < first.length && first[i] === last[i]) i++;
		return first.slice(0, i);
	}
}
