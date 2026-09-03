import type { CacheEvictDecorator, CacheEvictOptions, CacheHost } from '../interfaces';
import { assertCacheHost } from '../utils';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export function CacheEvict(options: CacheEvictOptions): CacheEvictDecorator {
	const { prefix } = options;
	const prefixes = Array.isArray(prefix) ? prefix : [prefix];

	const decorator: CacheEvictDecorator = (target, propertyKey, descriptor) => {
		const originalMethod = descriptor.value;
		if (!originalMethod) return descriptor;

		descriptor.value = async function (this: CacheHost, ...args: Parameters<typeof originalMethod>): Promise<ReturnType<typeof originalMethod>> {
			assertCacheHost(this);

			const result = await originalMethod.apply(this, args);
			await Promise.all(prefixes.map(async p => this.cache.invalidateByPrefix(p)));

			return result;
		};

		return descriptor;
	};

	return decorator;
}
