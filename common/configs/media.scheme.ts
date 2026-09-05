import Joi from 'joi';

export const mediaSchema = Joi.object({
	S3_ENDPOINT: Joi.string().default('http://localhost:9000'),
	S3_REGION: Joi.string().default('us-east-1'),
	S3_BUCKET: Joi.string().default('media'),
	S3_ACCESS_KEY: Joi.string().default('minioadmin'),
	S3_SECRET_KEY: Joi.string().default('minioadmin'),
	MEDIA_UPLOAD_URL_TTL: Joi.number().default(900),
	MEDIA_DOWNLOAD_URL_TTL: Joi.number().default(300),
	MEDIA_MAX_URL_TTL: Joi.number().default(3600),
});
