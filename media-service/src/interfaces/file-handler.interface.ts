export interface FileHandlerPrepareParams {
	purpose: string;
	ownerAccountId: string;
	filename?: string;
	metadata?: Record<string, string>;
	sizeBytes?: number;
}

export interface PresignedPostUpload {
	url: string;
	fields: Record<string, string>;
	expiresAt: string;
}

export interface FileHandlerPrepareResult {
	key: string;
	upload?: PresignedPostUpload;
}

export interface VerifyUploadParams {
	key: string;
}

export interface VerifyUploadResult {
	confirmed: boolean;
	mimeType: string | null;
	reason?: string;
}

export interface IFileHandler {
	prepareUpload(params: FileHandlerPrepareParams): Promise<FileHandlerPrepareResult>;
	verifyUpload(params: VerifyUploadParams): Promise<VerifyUploadResult>;
}
