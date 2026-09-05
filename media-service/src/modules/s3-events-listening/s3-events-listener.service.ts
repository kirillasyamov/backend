import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { RedisStreamConsumer, type RedisStreamConsumerHandle } from '@kirillasyamov/common';
import { MINIO_STREAM, CONSUMER_GROUP, CONSUMER_NAME } from '../../media.constants';
import { toFileUploadedEvent } from '../../utils';
import type { IListenEvents, UploadEventCallback } from './listen-events.interface';

@Injectable()
export class S3EventsListener implements IListenEvents, OnApplicationBootstrap, OnApplicationShutdown {
	private readonly logger = new Logger(S3EventsListener.name);
	private readonly listeners = new Set<UploadEventCallback>();
	private handle?: RedisStreamConsumerHandle;

	constructor(private readonly consumer: RedisStreamConsumer) {}

	onUpload(listener: UploadEventCallback): void {
		this.listeners.add(listener);
	}

	async onApplicationBootstrap(): Promise<void> {
		this.handle = this.consumer.createConsumer(
			{
				streamName: MINIO_STREAM,
				groupName: CONSUMER_GROUP,
				consumerName: CONSUMER_NAME,
				readOptions: { count: 1, blockMs: 5000 },
				onEntryError: (id, error) => {
					this.logger.error(`Event handling failed, leaving pending for redelivery: id=${id}`, error instanceof Error ? error.stack : String(error));
				},
			},
			this.consume.bind(this),
		);
		await this.handle.start();
	}

	onApplicationShutdown(): void {
		this.handle?.stop();
	}

	private async consume(_id: string, fields: string[]): Promise<void> {
		const event = toFileUploadedEvent(fields);
		if (!event) {
			this.logger.warn(`Unparseable event, acking: fields=${JSON.stringify(fields)}`);
			return;
		}

		for (const listener of this.listeners) {
			await listener(event);
		}
	}
}
