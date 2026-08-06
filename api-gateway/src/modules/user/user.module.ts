import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { authProtoPath, userProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { grpcServiceConfig } from '@kirillasyamov/common/configs';
import { UserController } from './user.controller';
import { UserService } from './user.service';

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
						url: grpcServiceConfig.authServiceUrl,
						channelOptions: grpcServiceConfig.grpcChannelOptions,
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
						url: grpcServiceConfig.userServiceUrl,
						channelOptions: grpcServiceConfig.grpcChannelOptions,
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
