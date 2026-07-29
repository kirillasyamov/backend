import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { fileURLToPath } from 'node:url';
import { UserController } from './user.controller';
import { UserService } from './user.service';

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
		]),
	],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
