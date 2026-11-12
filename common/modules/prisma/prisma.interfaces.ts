import type { InjectionToken, ModuleMetadata, OptionalFactoryDependency, Type } from '@nestjs/common';
import type { SqlDriverAdapterFactory } from '@prisma/client/runtime/client';
export type PrismaClientConstructor = new (config: { adapter: SqlDriverAdapterFactory }) => PrismaClientLike;

export interface PrismaClientLike {
	$connect(): Promise<void>;
	$disconnect(): Promise<void>;
}

export interface PrismaModuleAsyncOptions {
	isGlobal?: boolean;
	clientClass: Type;
	imports?: ModuleMetadata['imports'];
	inject?: (InjectionToken | OptionalFactoryDependency)[];
	useFactory?: (...args: unknown[]) => PrismaClientLike | Promise<PrismaClientLike>;
	adapter: SqlDriverAdapterFactory;
}
