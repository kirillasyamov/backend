import { NestFactory } from '@nestjs/core';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { MediaModule } from './media.module';
import { MEDIA_PROTO_VERSION, HEALTH_PROTO_VERSION } from '@kirillasyamov/common/contracts';
import { mediaProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { GrpcExceptionFilter } from '@kirillasyamov/common/filters';
import { GrpcLoggingInterceptor } from '@kirillasyamov/common/interceptors';
import { grpcServiceConfig } from '@kirillasyamov/common/configs';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(MediaModule, {
		transport: Transport.GRPC,
		options: {
			package: [MEDIA_PROTO_VERSION, HEALTH_PROTO_VERSION],
			protoPath: [mediaProtoPath, healthProtoPath],
			url: `${grpcServiceConfig.host}:${String(grpcServiceConfig.port)}`,
			loader: {
				keepCase: false,
				longs: String,
				enums: String,
				defaults: true,
				oneofs: true,
			},
		},
	});

	void app.useGlobalFilters(new GrpcExceptionFilter());
	app.useGlobalInterceptors(new GrpcLoggingInterceptor());
	app.enableShutdownHooks();

	await app.listen();
}
void bootstrap();
