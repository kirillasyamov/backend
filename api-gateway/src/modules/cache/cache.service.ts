import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT, type RedisClient } from '@kirillasyamov/common';

@Injectable()
export class CacheService {
	private readonly logger = new Logger(CacheService.name);
	private readonly jitterRatio = 0.1;

	constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

	private jittered(ttlSeconds: number): number {
		const delta = ttlSeconds * this.jitterRatio;
		const ttl = ttlSeconds + (Math.random() * 2 - 1) * delta;
		return Math.max(1, Math.floor(ttl));
	}

	public async get<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
		try {
			const cached = await this.read<T>(key);
			if (cached !== null) {
				this.logger.debug(`Cache hit: ${key}`);
				return cached;
			}
		} catch (error) {
			this.logger.warn(`Cache get failed, bypassing: ${key}`, error instanceof Error ? error.message : String(error));
		}

		const value = await producer();

		try {
			await this.redis.set(key, JSON.stringify(value), 'EX', this.jittered(ttlSeconds));
			this.logger.debug(`Cache set: ${key}`);
		} catch (error) {
			this.logger.warn(`Cache set failed, skipping: ${key}`, error instanceof Error ? error.message : String(error));
		}

		return value;
	}

	public async invalidate(...keys: string[]): Promise<void> {
		if (keys.length === 0) return;
		try {
			await this.redis.del(...keys);
		} catch (error) {
			this.logger.warn(`Cache invalidation failed: ${keys.join(',')}`, error instanceof Error ? error.message : String(error));
		}
	}

	public async invalidateByPrefix(prefix: string): Promise<void> {
		try {
			const keys: string[] = [];
			let cursor = '0';
			do {
				const [next, found] = await this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
				cursor = next;
				keys.push(...found);
			} while (cursor !== '0');

			if (keys.length > 0) await this.redis.unlink(...keys);
		} catch (error) {
			this.logger.warn(`Cache prefix invalidation failed: ${prefix}`, error instanceof Error ? error.message : String(error));
		}
	}

	private async read<T>(key: string): Promise<T | null> {
		const raw = await this.redis.get(key);
		if (raw === null) return null;
		return JSON.parse(raw) as T;
	}
}
