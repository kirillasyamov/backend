import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module';
import { GrpcExceptionFilter } from '@kirillasyamov/common/filters';
import { grpcServiceConfig } from '@kirillasyamov/common/configs';
import { healthProtoPath, userProtoPath } from '@kirillasyamov/common';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: ['user.v1', 'grpc.health.v1'],
			protoPath: [userProtoPath, healthProtoPath],
			url: `0.0.0.0:${String(grpcServiceConfig.port)}`,
		},
	});

	app.useGlobalFilters(new GrpcExceptionFilter());

	await app.listen();
}
void bootstrap();
