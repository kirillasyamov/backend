import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { TokenServiceModule } from './token-service.module';
import { Logger } from '@nestjs/common';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { grpcServiceConfig } from 'common/configs/grpc.config';

const healthProtoPath = fileURLToPath(import.meta.resolve('grpc-health-check/proto/health/v1/health.proto'));

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(TokenServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: ['token.v1', 'grpc.health.v1'],
			protoPath: [join(import.meta.dirname, '../../common/contracts/proto/token.proto'), healthProtoPath],
			url: `localhost:${grpcServiceConfig.port}`,
			loader: {
				keepCase: false,
				longs: String,
				enums: String,
				defaults: true,
				oneofs: true,
			},
		},
	});

	await app.listen();
}
bootstrap();
