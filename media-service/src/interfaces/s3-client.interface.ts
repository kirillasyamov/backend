export interface IS3ClientService {
	removeFile(bucket: string, payload: RemoveFilePayload): Promise<void>;
	createPresignedUpload(bucket: string, opts: PresignedUploadOptions): Promise<PresignedUploadResult>;
	getSignedDownloadUrl(bucket: string, key: string, expiresIn: number): Promise<string>;
	headObject(bucket: string, key: string): Promise<HeadObjectOutput>;
	getObject(bucket: string, key: string, range?: string): Promise<GetObjectOutput>;
	getObjectTags(bucket: string, key: string): Promise<Record<string, string>>;
	putObjectTagging(bucket: string, key: string, tags: Record<string, string>): Promise<void>;
	listObjects(bucket: string, prefix: string, opts?: ListedObjectsOptions): Promise<ListedPage>;
}

export interface ListedObjectsOptions {
	limit?: number;
	cursor?: string;
}

export interface ListedPage {
	items: ListedObject[];
	nextCursor?: string;
}

export interface RemoveFilePayload {
	path: string;
}

export interface PresignedUploadOptions {
	key: string;
	expiresInSeconds: number;
	maxSizeBytes?: number;
	allowedMimeTypes?: readonly string[];
	metadata?: Record<string, string>;
}

export interface PresignedUploadResult {
	url: string;
	fields: Record<string, string>;
	expiresAt: string;
}

export interface HeadObjectOutput {
	contentType?: string;
	contentLength?: number;
	lastModified?: Date;
	metadata?: Record<string, string>;
}

export interface GetObjectOutput {
	body: { transformToByteArray(): Promise<Uint8Array>; destroy?(): void };
}

export interface ListedObject {
	key: string;
	sizeBytes: number;
	lastModified?: Date;
}
