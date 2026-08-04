import { NestFactory } from '@nestjs/core';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { TokenServiceModule } from './token-service.module';
import { tokenProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { GrpcExceptionFilter } from '@kirillasyamov/common/filters';
import { grpcServiceConfig } from '@kirillasyamov/common/configs';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(TokenServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: ['token.v1', 'grpc.health.v1'],
			protoPath: [tokenProtoPath, healthProtoPath],
			url: `localhost:${String(grpcServiceConfig.port)}`,
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

	await app.listen();
}
void bootstrap();
