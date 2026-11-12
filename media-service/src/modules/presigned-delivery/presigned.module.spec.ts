import { Test } from '@nestjs/testing';
import type { ClientGrpc } from '@nestjs/microservices';
import { describe, it, expect, vi } from 'vitest';
import { S3ClientModule } from '@kirillasyamov/common';
import { mediaConfig } from '@kirillasyamov/common/configs';
import { USER_SERVICE_NAME, type UserServiceClient } from '@kirillasyamov/common/contracts/generated/user';
import { USER_PACKAGE } from '../../media.constants';
import { LISTEN_EVENTS } from '../s3-events-listening';
import { PresignedModule } from './presigned.module';

describe('PresignedModule', () => {
	it('resolves the user-service gRPC client with the SetAvatarStatus method bound', async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [
				S3ClientModule.forRoot({
					endpoint: mediaConfig.s3Endpoint,
					region: mediaConfig.s3Region,
					accessKeyId: mediaConfig.s3AccessKey,
					secretAccessKey: mediaConfig.s3SecretKey,
					forcePathStyle: true,
				}),
				PresignedModule,
			],
		})
			.overrideProvider(LISTEN_EVENTS)
			.useValue({ onUpload: vi.fn() })
			.compile();

		const client = moduleRef.get<ClientGrpc>(USER_PACKAGE);
		expect(client).toBeDefined();

		const service = client.getService<UserServiceClient>(USER_SERVICE_NAME);
		expect(typeof service.setAvatarStatus).toBe('function');
	});
});
