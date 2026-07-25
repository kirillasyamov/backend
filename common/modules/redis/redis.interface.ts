import type { ModuleMetadata } from '@nestjs/common';
import type { RedisOptions } from 'ioredis';

export type RedisModuleOptions = RedisOptions;

export interface RedisModuleAsyncOptions {
	isGlobal?: boolean;
	imports?: ModuleMetadata['imports'];
	inject?: any[];
	useFactory: (...args: any[]) => RedisModuleOptions | Promise<RedisModuleOptions>;
}
