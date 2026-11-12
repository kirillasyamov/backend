import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

import type { AwsStoreOptions } from './interfaces/index';
import { S3ClientService } from './s3-client.service';
import { S3_CLIENT } from './s3-client.tokens';

@Module({})
export class S3ClientModule {
	static forRoot(options: AwsStoreOptions): DynamicModule {
		const clientProvider = {
			provide: S3_CLIENT,
			useFactory: () =>
				new S3Client({
					region: options.region,
					endpoint: options.endpoint,
					credentials: {
						accessKeyId: options.accessKeyId,
						secretAccessKey: options.secretAccessKey,
					},
					forcePathStyle: options.forcePathStyle ?? true,
				}),
		} as const;

		return {
			module: S3ClientModule,
			global: true,
			providers: [clientProvider, S3ClientService],
			exports: [S3_CLIENT, S3ClientService],
		};
	}
}
