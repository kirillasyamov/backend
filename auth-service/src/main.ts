import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: 'auth.v1',
			protoPath: join(import.meta.dirname, '../../common/contracts/proto/auth.proto'),
			url: `0.0.0.0:${process.env.GRPC_PORT ?? 50002}`,
		},
	});

	await app.listen();
}
bootstrap();
