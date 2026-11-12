import { Injectable, Logger } from '@nestjs/common';
import { RedisStream } from './stream.service';
import type { RedisStreamConsumerHandle, RedisStreamConsumerOptions, StreamMessageHandler } from './interfaces';

@Injectable()
export class RedisStreamConsumer {
	private readonly logger = new Logger(RedisStreamConsumer.name);

	constructor(private readonly stream: RedisStream) {}

	public async consumeOnce(options: RedisStreamConsumerOptions, handle: StreamMessageHandler): Promise<number> {
		const entries = await this.stream.readGroup(options.streamName, options.groupName, options.consumerName, options.readOptions);

		let processed = 0;
		for (const entry of entries ?? []) {
			try {
				await handle(entry.id, entry.fields);
				processed += 1;
			} catch (error) {
				options.onEntryError?.(entry.id, error);
				continue;
			}
			await this.stream.ack(options.streamName, options.groupName, entry.id);
		}
		return processed;
	}

	public createConsumer(options: RedisStreamConsumerOptions, handle: StreamMessageHandler): RedisStreamConsumerHandle {
		let running = false;
		const isRunning = (): boolean => running;

		return {
			start: async () => {
				await this.stream.ensureGroup(options.streamName, options.groupName);
				running = true;
				void (async () => {
					while (isRunning()) {
						try {
							await this.consumeOnce(options, handle);
						} catch (error) {
							this.logger.error(
								`Consumer loop iteration failed: stream=${options.streamName} group=${options.groupName}`,
								error instanceof Error ? error.stack : String(error),
							);
						}
					}
				})();
			},
			stop: () => {
				running = false;
			},
			consumeOnce: async () => this.consumeOnce(options, handle),
		};
	}
}
