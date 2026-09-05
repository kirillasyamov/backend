import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';
import { authProtoPath, userProtoPath, tokenProtoPath, mediaProtoPath, healthProtoPath } from '@kirillasyamov/common';
import { AUTH_PROTO_VERSION, USER_PROTO_VERSION, TOKEN_PROTO_VERSION, MEDIA_PROTO_VERSION, HEALTH_PROTO_VERSION } from '@kirillasyamov/common/contracts';
import { grpcClients, grpcServiceConfig } from '@kirillasyamov/common/configs';
import { AUTH_PACKAGE, USER_PACKAGE, TOKEN_PACKAGE, MEDIA_PACKAGE } from '@/gateway.constants';

@Module({
	imports: [
		ClientsModule.registerAsync(
			grpcClients([
				{ name: AUTH_PACKAGE, packages: [AUTH_PROTO_VERSION, HEALTH_PROTO_VERSION], protoPaths: [authProtoPath, healthProtoPath], url: grpcServiceConfig.authServiceUrl },
				{ name: USER_PACKAGE, packages: [USER_PROTO_VERSION, HEALTH_PROTO_VERSION], protoPaths: [userProtoPath, healthProtoPath], url: grpcServiceConfig.userServiceUrl },
				{
					name: TOKEN_PACKAGE,
					packages: [TOKEN_PROTO_VERSION, HEALTH_PROTO_VERSION],
					protoPaths: [tokenProtoPath, healthProtoPath],
					url: grpcServiceConfig.tokenServiceUrl,
				},
				{
					name: MEDIA_PACKAGE,
					packages: [MEDIA_PROTO_VERSION, HEALTH_PROTO_VERSION],
					protoPaths: [mediaProtoPath, healthProtoPath],
					url: grpcServiceConfig.mediaServiceUrl,
				},
			]),
		),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtAuthGuard],
	exports: [ClientsModule, JwtAuthGuard],
})
export class AuthModule {}
