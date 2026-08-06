import { Module } from '@nestjs/common';
import { ConfigModule, RedisModule } from '@kirillasyamov/common';
import { redisConfig, redisSchema, jwtSchema, grpcSchema } from '@kirillasyamov/common/configs';
import { BlacklistModule } from './modules/blacklist/blacklist.module';
import { TokenServiceController } from './token-service.controller';
import { TokenService } from './token-service.service';

@Module({
	imports: [ConfigModule.forRoot(redisSchema, jwtSchema, grpcSchema), RedisModule.forRoot(redisConfig), BlacklistModule],
	controllers: [TokenServiceController],
	providers: [TokenService],
})
export class TokenServiceModule {}
