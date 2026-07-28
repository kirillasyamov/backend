import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { fileURLToPath } from 'node:url';

const healthProtoPath = fileURLToPath(import.meta.resolve('grpc-health-check/proto/health/v1/health.proto'));

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'AUTH_PACKAGE',
				useFactory: () => ({
					transport: Transport.GRPC,
					options: {
						package: ['auth.v1', 'grpc.health.v1'],
						protoPath: ['../common/contracts/proto/auth.proto', healthProtoPath],
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
						protoPath: ['../common/contracts/proto/user.proto', healthProtoPath],
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
						protoPath: ['../common/contracts/proto/token.proto', healthProtoPath],
						url: 'localhost:50004',
					},
				}),
			},
		]),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtAuthGuard],
	exports: [ClientsModule, JwtAuthGuard],
})
export class AuthModule {}
