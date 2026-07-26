import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { createRequire } from 'node:module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const require = createRequire(import.meta.url);
const healthProtoPath = require.resolve('grpc-health-check/proto/health/v1/health.proto');

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'AUTH_PACKAGE',
				useFactory: () => ({
					transport: Transport.GRPC,
					options: {
						package: ['auth.v1', 'grpc.health.v1'],
						protoPath: [
							'../common/contracts/proto/auth.proto',
							healthProtoPath,
						],
						url: 'localhost:50002',
					},
				}),
			},
			{
				name: 'USER_PACKAGE',
				useFactory: () => ({
					transport: Transport.GRPC,
					options: {
						package: ['user.v1', 'grpc.health.v1'],
						protoPath: [
							'../common/contracts/proto/user.proto',
							healthProtoPath,
						],
						url: 'localhost:50051',
					},
				}),
			},
			{
				name: 'TOKEN_PACKAGE',
				useFactory: () => ({
					transport: Transport.GRPC,
					options: {
						package: ['token.v1', 'grpc.health.v1'],
						protoPath: [
							'../common/contracts/proto/token.proto',
							healthProtoPath,
						],
						url: 'localhost:50004',
					},
				}),
			},
		]),
	],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [ClientsModule],
})
export class AuthModule {}
