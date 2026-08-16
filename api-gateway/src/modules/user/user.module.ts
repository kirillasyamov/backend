import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { authProtoPath, userProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { grpcClients, grpcServiceConfig } from '@kirillasyamov/common/configs';
import { AUTH_PACKAGE, USER_PACKAGE } from '@/gateway.constants';
import { UserController } from './user.controller';
import { UserBalanceController } from './balance.controller';
import { UserService } from './user.service';

@Module({
	imports: [
		ClientsModule.registerAsync(
			grpcClients([
				{ name: AUTH_PACKAGE, packages: ['auth.v1', 'grpc.health.v1'], protoPaths: [authProtoPath, healthProtoPath], url: grpcServiceConfig.authServiceUrl },
				{ name: USER_PACKAGE, packages: ['user.v1', 'grpc.health.v1'], protoPaths: [userProtoPath, healthProtoPath], url: grpcServiceConfig.userServiceUrl },
			]),
		),
	],
	controllers: [UserController, UserBalanceController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
