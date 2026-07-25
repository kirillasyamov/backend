import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserServiceModule, {
		transport: Transport.GRPC,
		options: {
			package: 'user.v1',
			protoPath: join(import.meta.dirname, '../../common/contracts/proto/user.proto'),
			url: `0.0.0.0:${process.env.GRPC_PORT ?? 50051}`,
		},
	});

	await app.listen();
}
bootstrap();
