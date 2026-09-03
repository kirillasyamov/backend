import type { MethodDecorator } from './method-decorator.interface';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type KeyResolver<TArgs extends any[] = any[]> = (...args: TArgs) => string;

export interface CacheGetOptions<TArgs extends any[] = any[]> {
	keyResolver: KeyResolver<TArgs>;
	ttlSeconds?: number;
}

/* eslint-disable-next-line @typescript-eslint/no-empty-object-type */
export interface CacheGetDecorator<TArgs extends any[] = any[]> extends MethodDecorator<(...args: TArgs) => any> {}
