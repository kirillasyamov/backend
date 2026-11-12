import type { Timestamp } from '../contracts/generated/google/protobuf/timestamp';

export function toTimestamp(date: Date): Timestamp {
	return {
		seconds: Math.floor(date.getTime() / 1000),
		nanos: (date.getTime() % 1000) * 1_000_000,
	};
}
