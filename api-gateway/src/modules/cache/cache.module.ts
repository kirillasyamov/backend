import { Global, Module } from '@nestjs/common';
import { RedisModule } from '@kirillasyamov/common';
import { cacheConfig } from '@kirillasyamov/common/configs';
import { CacheService } from './cache.service';

@Global()
@Module({
	imports: [RedisModule.forRoot(cacheConfig)],
	providers: [CacheService],
	exports: [CacheService],
})
export class CacheModule {}
