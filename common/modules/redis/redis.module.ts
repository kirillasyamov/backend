import { Module } from '@nestjs/common';
import type { DynamicModule, Provider } from '@nestjs/common';
import Redis from 'ioredis';
import type { RedisClient, RedisModuleAsyncOptions, RedisModuleOptions } from './interfaces';
import { REDIS_CLIENT } from './redis.tokens';
import { RedisLifecycle } from './redis.lifecycle';
import { RedisStream } from './modules/stream';
import { RedisStreamConsumer } from './modules/stream';

@Module({})
export class RedisModule {
	static forRoot(options: RedisModuleOptions): DynamicModule {
		const redisProvider: Provider = {
			provide: REDIS_CLIENT,
			useFactory: async (): Promise<RedisClient> => {
				const client = new Redis(options);
				await client.ping();
				return client as unknown as RedisClient;
			},
		};

		return {
			module: RedisModule,
			global: true,
			providers: [redisProvider, RedisLifecycle, RedisStream, RedisStreamConsumer],
			exports: [REDIS_CLIENT, RedisStream, RedisStreamConsumer],
		};
	}

	static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
		const redisProvider: Provider = {
			provide: REDIS_CLIENT,
			useFactory: async (...args: unknown[]): Promise<RedisClient> => {
				const opts = await options.useFactory(...args);
				const client = new Redis(opts);
				await client.ping();
				return client as unknown as RedisClient;
			},
			inject: options.inject ?? [],
		};

		return {
			module: RedisModule,
			global: options.isGlobal ?? true,
			imports: options.imports ?? [],
			providers: [redisProvider, RedisLifecycle, RedisStream, RedisStreamConsumer],
			exports: [REDIS_CLIENT, RedisStream, RedisStreamConsumer],
		};
	}
}
