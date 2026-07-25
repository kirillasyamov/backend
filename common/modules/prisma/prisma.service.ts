import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnModuleInit, OnModuleDestroy, OnApplicationShutdown } from '@nestjs/common';
import type { PrismaClientLike } from './prisma.interfaces';

import { PRISMA_CLIENT_CLASS, PRISMA_ADAPTER } from './prisma.tokens';
import type { SqlDriverAdapterFactory } from '@prisma/client/runtime/client';
import type { PrismaClientConstructor } from './prisma.interfaces';

@Injectable()
export class PrismaService implements OnModuleInit, OnApplicationShutdown {
	private isConnected = false;
	private readonly client: PrismaClientLike;
	private readonly logger: Logger;

	constructor(
		@Inject(PRISMA_ADAPTER)
		adapter: SqlDriverAdapterFactory,
		@Inject(PRISMA_CLIENT_CLASS)
		ClientClass: PrismaClientConstructor,
	) {
		this.client = new ClientClass({ adapter });
		this.logger = new Logger(PrismaService.name + ':' + adapter.provider.toUpperCase());
	}

	async onModuleInit(): Promise<void> {
		const start = Date.now();
		this.logger.log('Connecting to database');
		try {
			await this.client.$connect();
			const ms = Date.now() - start;
			this.logger.log(`Database connection established (time ${ms}ms).`);
		} catch (error) {
			this.logger.error('Database connection failed: ', { error });
			throw error;
		}
	}

	async onApplicationShutdown(signal?: string): Promise<void> {
		this.logger.log(`Received shutdown signal: ${signal ?? 'unknown'}`);
		if (!this.isConnected) return this.logger.log(`Database connection closed.`);
		this.logger.log('Disconnecting from database');
		try {
			await this.client.$disconnect();
			this.isConnected = false;
			this.logger.log('Database connection closed.');
		} catch (error) {
			this.logger.error('Failed to disconnect from database', { error });
		}
	}
}
