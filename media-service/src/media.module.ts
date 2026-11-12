import { Module } from '@nestjs/common';
import { ConfigModule, RedisModule, S3ClientModule, S3ClientService } from '@kirillasyamov/common';
import { grpcSchema, mediaSchema, mediaConfig, redisConfig, redisSchema } from '@kirillasyamov/common/configs';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { PresignedModule } from './modules/presigned-delivery';
import { S3_BUCKET, S3_CLIENT_SERVICE } from './interfaces';

@Module({
	imports: [
		ConfigModule.forRoot(grpcSchema, redisSchema, mediaSchema),
		S3ClientModule.forRoot({
			endpoint: mediaConfig.s3Endpoint,
			region: mediaConfig.s3Region,
			accessKeyId: mediaConfig.s3AccessKey,
			secretAccessKey: mediaConfig.s3SecretKey,
			forcePathStyle: true,
		}),
		RedisModule.forRoot(redisConfig),
		PresignedModule,
	],
	controllers: [MediaController],
	providers: [
		{
			provide: S3_BUCKET,
			useValue: mediaConfig.s3Bucket,
		},
		{
			provide: S3_CLIENT_SERVICE,
			useExisting: S3ClientService,
		},
		MediaService,
	],
})
export class MediaModule {}
