import { Module } from '@nestjs/common';
import type { DynamicModule, Provider } from '@nestjs/common';
import Redis from 'ioredis';
import type { RedisModuleAsyncOptions, RedisModuleOptions } from './redis.interface';
import { REDIS_CLIENT } from './redis.tokens';
import { RedisLifecycle } from './redis.lifecycle';

@Module({})
export class RedisModule {
	static forRoot(options: RedisModuleOptions): DynamicModule {
		const redisProvider: Provider = {
			provide: REDIS_CLIENT,
			useFactory: async () => {
				const client = new Redis(options);
				await client.ping();
				return client;
			},
		};

		return {
			module: RedisModule,
			global: true,
			providers: [redisProvider, RedisLifecycle],
			exports: [REDIS_CLIENT],
		};
	}

	static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
		const redisProvider: Provider = {
			provide: REDIS_CLIENT,
			useFactory: async (...args: any[]) => {
				const opts = await options.useFactory(...args);
				const client = new Redis(opts);
				await client.ping();
				return client;
			},
			inject: options.inject ?? [],
		};

		return {
			module: RedisModule,
			global: options.isGlobal ?? true,
			imports: options.imports ?? [],
			providers: [redisProvider, RedisLifecycle],
			exports: [REDIS_CLIENT],
		};
	}
}
