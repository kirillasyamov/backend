import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GatewayController } from './app.controller';
import { GatewayService } from './app.service';
import { ConfigModule } from 'common/modules/config';
import { apiGatewaySchema } from 'common/dist/configs/gateway.env.scheme.js';
import { AuthModule } from './modules/auth/auth.module';

@Module({
	imports: [ConfigModule.forRoot(apiGatewaySchema), ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]), AuthModule],
	controllers: [GatewayController],
	providers: [GatewayService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class GatewayModule {}
