import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { authProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { GrpcExceptionFilter } from '@kirillasyamov/common/filters';
import { grpcServiceConfig } from '@kirillasyamov/common/configs';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: ['auth.v1', 'grpc.health.v1'],
			protoPath: [authProtoPath, healthProtoPath],
			url: `${grpcServiceConfig.host}:${String(grpcServiceConfig.port)}`,
		},
	});

	app.useGlobalFilters(new GrpcExceptionFilter());
	app.enableShutdownHooks();

	await app.listen();
}
void bootstrap();
