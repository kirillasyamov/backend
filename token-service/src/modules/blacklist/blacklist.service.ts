import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from 'common/modules/redis';
import type Redis from 'ioredis';

const BLACKLIST_PREFIX = 'jwt:blacklist:';

@Injectable()
export class BlacklistService {
	private readonly logger = new Logger(BlacklistService.name);

	constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

	public async isBlacklisted(token: string): Promise<boolean> {
		const key = `${BLACKLIST_PREFIX}${token}`;
		const result = await this.redis.exists(key);
		return result === 1;
	}

	public async addToBlacklist(token: string, ttlSeconds: number): Promise<void> {
		const key = `${BLACKLIST_PREFIX}${token}`;
		await this.redis.set(key, '1', 'EX', ttlSeconds);
		this.logger.debug(`Token blacklisted with ttl=${ttlSeconds}s`);
	}
}
