import type { ReadGroupOptions } from './stream.interface';

export type StreamMessageHandler = (entryId: string, fields: string[]) => Promise<void> | void;

export interface RedisStreamConsumerOptions {
	streamName: string;
	groupName: string;
	consumerName: string;
	readOptions?: ReadGroupOptions;
	onEntryError?: (entryId: string, error: unknown) => void;
}

export interface RedisStreamConsumerHandle {
	start(): Promise<void>;
	stop(): void;
	consumeOnce(): Promise<number>;
}
