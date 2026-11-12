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
