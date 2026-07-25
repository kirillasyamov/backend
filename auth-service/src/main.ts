import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { AuthServiceModule } from './auth-service.module';
import { GrpcExceptionFilter } from 'common/filters/grpc-exception.filter';
import { fileURLToPath } from 'node:url';

const healthProtoPath = fileURLToPath(import.meta.resolve('grpc-health-check/proto/health/v1/health.proto'));

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: ['auth.v1', 'grpc.health.v1'],
			protoPath: [join(import.meta.dirname, '../../common/contracts/proto/auth.proto'), healthProtoPath],
			url: `0.0.0.0:${process.env.GRPC_PORT ?? 50002}`,
		},
	});

	app.useGlobalFilters(new GrpcExceptionFilter());

	await app.listen();
}
bootstrap();
