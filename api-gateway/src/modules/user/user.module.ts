import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { AUTH_PROTO_VERSION, USER_PROTO_VERSION, MEDIA_PROTO_VERSION, HEALTH_PROTO_VERSION } from '@kirillasyamov/common/contracts';
import { authProtoPath, userProtoPath, mediaProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { grpcClients, grpcServiceConfig } from '@kirillasyamov/common/configs';
import { AUTH_PACKAGE, USER_PACKAGE, MEDIA_PACKAGE } from '@/gateway.constants';
import { UserController } from './user.controller';
import { UserBalanceController } from './balance.controller';
import { AvatarController } from './avatar.controller';
import { UserService } from './user.service';

@Module({
	imports: [
		ClientsModule.registerAsync(
			grpcClients([
				{ name: AUTH_PACKAGE, packages: [AUTH_PROTO_VERSION, HEALTH_PROTO_VERSION], protoPaths: [authProtoPath, healthProtoPath], url: grpcServiceConfig.authServiceUrl },
				{ name: USER_PACKAGE, packages: [USER_PROTO_VERSION, HEALTH_PROTO_VERSION], protoPaths: [userProtoPath, healthProtoPath], url: grpcServiceConfig.userServiceUrl },
				{
					name: MEDIA_PACKAGE,
					packages: [MEDIA_PROTO_VERSION, HEALTH_PROTO_VERSION],
					protoPaths: [mediaProtoPath, healthProtoPath],
					url: grpcServiceConfig.mediaServiceUrl,
				},
			]),
		),
	],
	controllers: [UserController, UserBalanceController, AvatarController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
