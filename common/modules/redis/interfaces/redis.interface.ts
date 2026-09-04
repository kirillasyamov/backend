import type { InjectionToken, ModuleMetadata, OptionalFactoryDependency } from '@nestjs/common';

export interface RedisModuleOptions {
	host: string;
	port: number;
	password?: string;
	db?: number;
	keyPrefix?: string;
	connectTimeout?: number;
	enableReadyCheck?: boolean;
}

export interface RedisModuleAsyncOptions {
	isGlobal?: boolean;
	imports?: ModuleMetadata['imports'];
	inject?: (InjectionToken | OptionalFactoryDependency)[];
	useFactory: (...args: unknown[]) => RedisModuleOptions | Promise<RedisModuleOptions>;
}
