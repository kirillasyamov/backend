export interface HeadObjectOutput {
	contentType?: string;
	contentLength?: number;
	lastModified?: Date;
	metadata?: Record<string, string>;
}

export interface GetObjectBody {
	transformToByteArray(): Promise<Uint8Array>;
	destroy?(): void;
}

export interface GetObjectOutput {
	body: GetObjectBody;
	contentType?: string;
	contentLength?: number;
}

export interface ListedObject {
	key: string;
	sizeBytes: number;
	lastModified?: Date;
}

export interface ListedObjectsOptions {
	limit?: number;
	cursor?: string;
}

export interface ListedPage {
	items: ListedObject[];
	nextCursor?: string;
}
