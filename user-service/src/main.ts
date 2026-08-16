import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module';
import { GrpcExceptionFilter } from '@kirillasyamov/common/filters';
import { grpcServiceConfig } from '@kirillasyamov/common/configs';
import { USER_PROTO_VERSION, HEALTH_PROTO_VERSION } from '@kirillasyamov/common/contracts';
import { healthProtoPath, userProtoPath } from '@kirillasyamov/common';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: [USER_PROTO_VERSION, HEALTH_PROTO_VERSION],
			protoPath: [userProtoPath, healthProtoPath],
			url: `${grpcServiceConfig.host}:${String(grpcServiceConfig.port)}`,
		},
	});

	app.useGlobalFilters(new GrpcExceptionFilter());
	app.enableShutdownHooks();

	await app.listen();
}
void bootstrap();
