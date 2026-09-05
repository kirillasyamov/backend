import { Module } from '@nestjs/common';
import { S3ClientService } from '@kirillasyamov/common';
import { mediaConfig } from '@kirillasyamov/common/configs';
import { FILE_HANDLER, S3_BUCKET, S3_CLIENT_SERVICE } from '../../interfaces';
import { S3EventsListeningModule } from '../s3-events-listening';
import { UploadEventProcessor } from './upload-event.processor';
import { PresignedFileHandler } from './presigned.service';

@Module({
	imports: [S3EventsListeningModule],
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
