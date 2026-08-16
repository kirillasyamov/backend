import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GatewayController } from './app.controller';
import { GatewayService } from './app.service';
import { ConfigModule } from '@kirillasyamov/common';
import { apiGatewaySchema, authSchema } from '@kirillasyamov/common/configs';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { GrpcToHttpExceptionFilter } from '@kirillasyamov/common/filters';
import { LoggingInterceptor } from '@kirillasyamov/common/interceptors';
import { JwtAuthGuard, RolesGuard } from './modules/auth/guards';

@Module({
	imports: [ConfigModule.forRoot(apiGatewaySchema, authSchema), ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]), AuthModule, UserModule],
	controllers: [GatewayController],
	providers: [
		GatewayService,
		JwtAuthGuard,
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_GUARD, useClass: JwtAuthGuard },
		{ provide: APP_GUARD, useClass: RolesGuard },
		{ provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
		{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
		{ provide: APP_FILTER, useClass: GrpcToHttpExceptionFilter },
	],
})
export class GatewayModule {}
