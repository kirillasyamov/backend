export { S3_CLIENT } from './s3-client.tokens';
export { S3ClientModule } from './s3-client.module';
export { S3ClientService } from './s3-client.service';
export { S3ObjectNotFoundError, s3ErrorMapper } from './utils';
export type {
	AwsStoreOptions,
	GetObjectBody,
	GetObjectOutput,
	HeadObjectOutput,
	ListedObject,
	ListedObjectsOptions,
	ListedPage,
	PresignedUploadOptions,
	PresignedUploadResult,
	RemoveFilePayload,
} from './interfaces';
