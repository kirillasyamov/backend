import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { authProtoPath, userProtoPath, tokenProtoPath, healthProtoPath } from '@kirillasyamov/common';

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'AUTH_PACKAGE',
				useFactory: () => ({
					transport: Transport.GRPC,
					options: {
						package: ['auth.v1', 'grpc.health.v1'],
						protoPath: [authProtoPath, healthProtoPath],
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
						protoPath: [userProtoPath, healthProtoPath],
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
						protoPath: [tokenProtoPath, healthProtoPath],
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
