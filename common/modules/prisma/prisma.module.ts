import { Module } from '@nestjs/common';
import type { DynamicModule, Provider } from '@nestjs/common';
import type { PrismaModuleAsyncOptions } from './prisma.interfaces';
import { PRISMA_CLIENT_CLASS, PRISMA_ADAPTER, PRISMA_CLIENT } from './prisma.tokens';
import type { PrismaClientConstructor, PrismaClientLike } from './prisma.interfaces';
import type { SqlDriverAdapterFactory } from '@prisma/client/runtime/client';

@Module({})
export class PrismaModule {
	static forRootAsync(options: PrismaModuleAsyncOptions): DynamicModule {
		const adapterProvider: Provider = {
			provide: PRISMA_ADAPTER,
			useValue: options.adapter,
		};
		const clientClassProvider: Provider = {
			provide: PRISMA_CLIENT_CLASS,
			useValue: options.clientClass,
		};
		const prismaClientProvider: Provider = {
			provide: PRISMA_CLIENT,
			useFactory: (ClientClass: PrismaClientConstructor, adapter: SqlDriverAdapterFactory) => {
				return new ClientClass({ adapter });
			},
			inject: [PRISMA_CLIENT_CLASS, PRISMA_ADAPTER],
		};

		return {
			module: PrismaModule,
			global: options.isGlobal ?? false,
			imports: options.imports ?? [],
			providers: [adapterProvider, clientClassProvider, prismaClientProvider],
			exports: [PRISMA_CLIENT],
		};
	}
}
