import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GatewayController } from './app.controller';
import { GatewayService } from './app.service';
import { ConfigModule } from 'common/modules/config';
import { apiGatewaySchema } from 'common/dist/configs/gateway.env.scheme.js';
import { authSchema } from 'common/configs/auth.scheme';
import { AuthModule } from './modules/auth/auth.module';
import { GrpcToHttpExceptionFilter } from 'common/filters/grpc-to-http-exception.filter';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
	imports: [ConfigModule.forRoot(apiGatewaySchema, authSchema), ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]), AuthModule],
	controllers: [GatewayController],
	providers: [
		GatewayService,
		JwtAuthGuard,
		{ provide: APP_GUARD, useClass: JwtAuthGuard },
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_FILTER, useClass: GrpcToHttpExceptionFilter },
	],
})
export class GatewayModule {}
