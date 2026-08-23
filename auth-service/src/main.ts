import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AUTH_PROTO_VERSION, HEALTH_PROTO_VERSION } from '@kirillasyamov/common/contracts';
import { authProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { GrpcExceptionFilter } from '@kirillasyamov/common/filters';
import { grpcServiceConfig } from '@kirillasyamov/common/configs';
import { GrpcLoggingInterceptor } from '@kirillasyamov/common/interceptors';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: [AUTH_PROTO_VERSION, HEALTH_PROTO_VERSION],
			protoPath: [authProtoPath, healthProtoPath],
			url: `${grpcServiceConfig.host}:${String(grpcServiceConfig.port)}`,
		},
	});

	app.useGlobalFilters(new GrpcExceptionFilter());
	app.useGlobalInterceptors(new GrpcLoggingInterceptor());
	app.enableShutdownHooks();

	await app.listen();
}
void bootstrap();
