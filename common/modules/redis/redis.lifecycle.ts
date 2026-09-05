import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { RedisClient } from './interfaces';
import { REDIS_CLIENT } from './redis.tokens';

@Injectable()
export class RedisLifecycle implements OnApplicationShutdown {
	private readonly logger = new Logger(RedisLifecycle.name);

	constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}

	async onApplicationShutdown(): Promise<void> {
		this.logger.log('Disconnecting from Redis');
		try {
			await this.client.quit();
			this.logger.log('Redis connection closed.');
		} catch (error) {
			this.logger.error('Failed to disconnect from Redis', { error });
		}
	}
}
