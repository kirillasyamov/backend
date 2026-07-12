import { Module } from '@nestjs/common';
import type { DynamicModule, Provider } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { PrismaModuleAsyncOptions } from './prisma.interfaces';
import { PRISMA_CLIENT_CLASS, PRISMA_ADAPTER } from './prisma.tokens';

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

		return {
			module: PrismaModule,
			global: options.isGlobal ?? false,
			imports: options.imports ?? [],
			providers: [adapterProvider, clientClassProvider, PrismaService],
			exports: [PrismaService],
		};
	}
}
