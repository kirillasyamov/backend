import type { MethodDecorator } from './method-decorator.interface';

export interface CacheEvictOptions {
	prefix: string | string[];
}

export type CacheEvictDecorator = MethodDecorator;
