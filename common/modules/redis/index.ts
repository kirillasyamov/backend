export { REDIS_CLIENT } from './redis.tokens';
export { RedisModule } from './redis.module';
export { RedisStream, RedisStreamConsumer } from './modules/stream';
export type { RedisClient, RedisModuleAsyncOptions, RedisModuleOptions } from './interfaces';
export type {
	AutoClaimOptions,
	AutoClaimResult,
	ReadGroupOptions,
	StreamEntry,
	RedisStreamConsumerOptions,
	RedisStreamConsumerHandle,
	StreamMessageHandler,
} from './modules/stream';
