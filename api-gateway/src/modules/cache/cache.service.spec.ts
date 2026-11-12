import type { RedisClient } from '@kirillasyamov/common';
import { mockDeep } from 'vitest-mock-extended';
import { CacheService } from './cache.service';

const createService = (redis?: RedisClient): CacheService => {
	const client = redis ?? mockDeep<RedisClient>();
	return new CacheService(client);
};

describe('CacheService', () => {
	it('returns producer result and writes to storage on miss', async () => {
		const redis = mockDeep<RedisClient>();
		redis.get.mockResolvedValue(null);
		const service = createService(redis);
		const producer = vi.fn().mockResolvedValue({ login: 'alice' });

		const result = await service.get('user:v1:alice', 60, producer);

		expect(result).toEqual({ login: 'alice' });
		expect(producer).toHaveBeenCalledTimes(1);
		expect(redis.set).toHaveBeenCalledTimes(1);
		expect(redis.set).toHaveBeenCalledWith('user:v1:alice', '{"login":"alice"}', 'EX', expect.any(Number));
	});

	it('returns cached value without calling producer on hit', async () => {
		const redis = mockDeep<RedisClient>();
		redis.get.mockResolvedValue(JSON.stringify({ login: 'alice' }));
		const service = createService(redis);
		const producer = vi.fn().mockResolvedValue({ login: 'alice' });

		const result = await service.get('user:v1:alice', 60, producer);

		expect(result).toEqual({ login: 'alice' });
		expect(producer).not.toHaveBeenCalled();
		expect(redis.set).not.toHaveBeenCalled();
	});

	it('bypasses cache when storage.get throws and still writes after producer', async () => {
		const redis = mockDeep<RedisClient>();
		redis.get.mockRejectedValue(new Error('redis down'));
		const service = createService(redis);
		const producer = vi.fn().mockResolvedValue({ login: 'alice' });

		const result = await service.get('user:v1:alice', 60, producer);

		expect(result).toEqual({ login: 'alice' });
		expect(redis.set).toHaveBeenCalledTimes(1);
	});

	it('returns producer result even when storage.set throws', async () => {
		const redis = mockDeep<RedisClient>();
		redis.get.mockResolvedValue(null);
		redis.set.mockRejectedValue(new Error('redis down'));
		const service = createService(redis);
		const producer = vi.fn().mockResolvedValue({ login: 'alice' });

		const result = await service.get('user:v1:alice', 60, producer);

		expect(result).toEqual({ login: 'alice' });
	});

	it('applies no jitter for deterministic ttl (random = 0.5)', async () => {
		const redis = mockDeep<RedisClient>();
		redis.get.mockResolvedValue(null);
		const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
		const service = createService(redis);

		await service.get('user:v1:alice', 60, vi.fn().mockResolvedValue(1));

		expect(redis.set).toHaveBeenCalledWith('user:v1:alice', '1', 'EX', 60);
		randomSpy.mockRestore();
	});

	it('invalidate delegates to redis.del', async () => {
		const redis = mockDeep<RedisClient>();
		const service = createService(redis);

		await service.invalidate('user:v1:alice', 'user:v1:bob');

		expect(redis.del).toHaveBeenCalledWith('user:v1:alice', 'user:v1:bob');
	});

	it('invalidateByPrefix scans and unlinks matching keys', async () => {
		const redis = mockDeep<RedisClient>();
		redis.scan.mockResolvedValueOnce(['0', ['user:v1:alice']]).mockResolvedValue(['0', []]);
		const service = createService(redis);

		await service.invalidateByPrefix('user:v1');

		expect(redis.unlink).toHaveBeenCalledWith('user:v1:alice');
	});
});
