import type { ModuleMetadata, Type } from '@nestjs/common';
import type { SqlDriverAdapterFactory } from '@prisma/client/runtime/client';
export interface PrismaClientConstructor {
	new (config: { adapter: SqlDriverAdapterFactory }): PrismaClientLike;
}

export interface PrismaClientLike {
	$connect(): Promise<void>;
	$disconnect(): Promise<void>;
}

export interface PrismaModuleAsyncOptions {
	isGlobal?: boolean;
	clientClass: Type<any>;
	imports?: ModuleMetadata['imports'];
	inject?: any[];
	useFactory?: (...args: any[]) => PrismaClientLike | Promise<PrismaClientLike>;
	adapter: SqlDriverAdapterFactory;
}
