import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { S3ClientService, userProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { HEALTH_PROTO_VERSION, USER_PROTO_VERSION } from '@kirillasyamov/common/contracts';
import { grpcClients, grpcServiceConfig, mediaConfig } from '@kirillasyamov/common/configs';
import { USER_PACKAGE } from '../../media.constants';
import { FILE_HANDLER, S3_BUCKET, S3_CLIENT_SERVICE } from '../../interfaces';
import { S3EventsListeningModule } from '../s3-events-listening';
import { UploadEventProcessor } from './upload-event.processor';
import { PresignedFileHandler } from './presigned.service';

@Module({
	imports: [
		S3EventsListeningModule,
		ClientsModule.registerAsync(
			grpcClients([
				{
					name: USER_PACKAGE,
					packages: [USER_PROTO_VERSION, HEALTH_PROTO_VERSION],
					protoPaths: [userProtoPath, healthProtoPath],
					url: grpcServiceConfig.userServiceUrl,
				},
			]),
		),
	],
	providers: [
		{
			provide: FILE_HANDLER,
			useClass: PresignedFileHandler,
		},
		UploadEventProcessor,
		{
			provide: S3_BUCKET,
			useValue: mediaConfig.s3Bucket,
		},
		{
			provide: S3_CLIENT_SERVICE,
			useExisting: S3ClientService,
		},
	],
	exports: [FILE_HANDLER],
})
export class PresignedModule {}
