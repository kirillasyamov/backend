import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { UserServiceModule } from './user-service.module';
import { GrpcExceptionFilter } from 'common/filters/grpc-exception.filter';
import { grpcServiceConfig } from 'common/configs/grpc.config';
import { fileURLToPath } from 'node:url';

const healthProtoPath = fileURLToPath(import.meta.resolve('grpc-health-check/proto/health/v1/health.proto'));

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: ['user.v1', 'grpc.health.v1'],
			protoPath: [join(import.meta.dirname, '../../common/contracts/proto/user.proto'), healthProtoPath],
			url: `0.0.0.0:${grpcServiceConfig.port}`,
		},
	});

	app.useGlobalFilters(new GrpcExceptionFilter());

	await app.listen();
}
bootstrap();
