import type { CacheHost } from '../interfaces';

export function assertCacheHost(target: unknown): asserts target is CacheHost {
	if (!target || typeof target !== 'object' || !('cache' in target)) {
		throw new Error(`[CacheDecorator] Target class must implement CacheHost with 'cache' property`);
	}
}
