import { Module } from '@nestjs/common';
import { ConfigModule } from 'common/modules/config';
import { RedisModule } from 'common/modules/redis';
import { redisConfig } from 'common/configs/redis.config';
import { redisSchema } from 'common/configs/redis.scheme';
import { jwtSchema } from 'common/configs/jwt.scheme';
import { grpcSchema } from 'common/configs/grpc.scheme';
import { BlacklistModule } from './modules/blacklist/blacklist.module';
import { TokenServiceController } from './token-service.controller';
import { TokenService } from './token-service.service';

@Module({
	imports: [ConfigModule.forRoot(redisSchema, jwtSchema, grpcSchema), RedisModule.forRoot(redisConfig), BlacklistModule],
	controllers: [TokenServiceController],
	providers: [TokenService],
})
export class TokenServiceModule {}
