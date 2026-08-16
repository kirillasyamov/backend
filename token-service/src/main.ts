import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { TokenServiceModule } from './token-service.module';
import { TOKEN_PROTO_VERSION, HEALTH_PROTO_VERSION } from '@kirillasyamov/common/contracts';
import { tokenProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { GrpcExceptionFilter } from '@kirillasyamov/common/filters';
import { grpcServiceConfig } from '@kirillasyamov/common/configs';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(TokenServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: [TOKEN_PROTO_VERSION, HEALTH_PROTO_VERSION],
			protoPath: [tokenProtoPath, healthProtoPath],
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
	app.enableShutdownHooks();

	await app.listen();
}
void bootstrap();
