import type { InjectionToken, ModuleMetadata, OptionalFactoryDependency } from '@nestjs/common';
import type { RedisOptions } from 'ioredis';

export type RedisModuleOptions = RedisOptions;

export interface RedisModuleAsyncOptions {
	isGlobal?: boolean;
	imports?: ModuleMetadata['imports'];
	inject?: (InjectionToken | OptionalFactoryDependency)[];
	useFactory: (...args: unknown[]) => RedisModuleOptions | Promise<RedisModuleOptions>;
}
