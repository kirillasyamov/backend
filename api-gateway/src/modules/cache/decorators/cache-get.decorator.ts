import { DEFAULT_CACHE_TTL_SECONDS } from '../cache.constants';
import type { CacheGetDecorator, CacheGetOptions, CacheHost } from '../interfaces';
import { assertCacheHost } from '../utils';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */

export function CacheGet<TArgs extends any[] = any[]>(options: CacheGetOptions<TArgs>): CacheGetDecorator<TArgs> {
	const { keyResolver } = options;
	const ttlSeconds = options.ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS;

	const decorator: CacheGetDecorator<TArgs> = (target, propertyKey, descriptor) => {
		const originalMethod = descriptor.value;
		if (!originalMethod) return descriptor;

		descriptor.value = async function (this: CacheHost, ...args: TArgs) {
			assertCacheHost(this);

			const cacheKey = keyResolver(...args);
			return this.cache.get(cacheKey, ttlSeconds, () => originalMethod.apply(this, args));
		};

		Object.defineProperty(descriptor.value, 'name', { value: String(propertyKey) });

		if (typeof Reflect.getMetadataKeys === 'function') {
			for (const metadataKey of Reflect.getMetadataKeys(originalMethod)) {
				if (!Reflect.hasMetadata(metadataKey, descriptor.value)) {
					Reflect.defineMetadata(metadataKey, Reflect.getMetadata(metadataKey, originalMethod), descriptor.value);
				}
			}
		}

		return descriptor;
	};

	return decorator;
}
