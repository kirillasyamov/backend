import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { authProtoPath, userProtoPath, tokenProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { grpcClients, grpcServiceConfig } from '@kirillasyamov/common/configs';
import { AUTH_PACKAGE, USER_PACKAGE, TOKEN_PACKAGE } from '@/gateway.constants';

@Module({
	imports: [
		ClientsModule.registerAsync(
			grpcClients([
				{ name: AUTH_PACKAGE, packages: ['auth.v1', 'grpc.health.v1'], protoPaths: [authProtoPath, healthProtoPath], url: grpcServiceConfig.authServiceUrl },
				{ name: USER_PACKAGE, packages: ['user.v1', 'grpc.health.v1'], protoPaths: [userProtoPath, healthProtoPath], url: grpcServiceConfig.userServiceUrl },
				{ name: TOKEN_PACKAGE, packages: ['token.v1', 'grpc.health.v1'], protoPaths: [tokenProtoPath, healthProtoPath], url: grpcServiceConfig.tokenServiceUrl },
			]),
		),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtAuthGuard],
	exports: [ClientsModule, JwtAuthGuard],
})
export class AuthModule {}
