export interface MediaConfig {
	s3Endpoint: string;
	s3Region: string;
	s3Bucket: string;
	s3AccessKey: string;
	s3SecretKey: string;
	uploadUrlTtl: number;
	downloadUrlTtl: number;
	maxUrlTtl: number;
}

export const mediaConfig: MediaConfig = {
	get s3Endpoint() {
		return process.env.S3_ENDPOINT ?? 'http://localhost:9000';
	},
	get s3Region() {
		return process.env.S3_REGION ?? 'us-east-1';
	},
	get s3Bucket() {
		return process.env.S3_BUCKET ?? 'media';
	},
	get s3AccessKey() {
		return process.env.S3_ACCESS_KEY ?? 'minioadmin';
	},
	get s3SecretKey() {
		return process.env.S3_SECRET_KEY ?? 'minioadmin';
	},
	get uploadUrlTtl() {
		return Number(process.env.MEDIA_UPLOAD_URL_TTL) || 900;
	},
	get downloadUrlTtl() {
		return Number(process.env.MEDIA_DOWNLOAD_URL_TTL) || 300;
	},
	get maxUrlTtl() {
		return Number(process.env.MEDIA_MAX_URL_TTL) || 3600;
	},
};
