import { Inject, Injectable } from '@nestjs/common';
import type { RedisClient } from '../../interfaces';
import { REDIS_CLIENT } from '../../redis.tokens';
import type { AutoClaimOptions, AutoClaimResult, ReadGroupOptions, StreamEntry } from './interfaces';

type StreamFields = string[];
type XReadGroupEntry = [id: string, fields: StreamFields];
type XReadGroupReply = [[stream: string, entries: XReadGroupEntry[]]];
type XAutoClaimEntry = [id: string, nil: null, fields: StreamFields];
type XAutoClaimReply = [nextStart: string, entries: XAutoClaimEntry[]];
type XPendingSummary = [count: number, minId: string, maxId: string, consumers: unknown[]];

@Injectable()
export class RedisStream {
	constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}

	async ensureGroup(stream: string, group: string): Promise<void> {
		try {
			await this.client.xgroup('CREATE', stream, group, '$', 'MKSTREAM');
		} catch (error) {
			const isBusyGroup = (error as { code?: string } | null)?.code === 'BUSYGROUP' || (error instanceof Error && error.message.includes('BUSYGROUP'));
			if (isBusyGroup) return;
			throw error;
		}
	}

	async readGroup(stream: string, group: string, consumer: string, opts?: ReadGroupOptions): Promise<StreamEntry[] | null> {
		const argv = ['GROUP', group, consumer, 'COUNT', opts?.count ?? 1, 'BLOCK', opts?.blockMs ?? 0, 'STREAMS', stream, '>'] as const;

		const reply = (await this.client.xreadgroup(...(argv as unknown as Parameters<RedisClient['xreadgroup']>))) as XReadGroupReply | null;
		if (!reply) return null;

		const entries = reply[0][1];
		return entries.map(([id, fields]) => ({ id, fields }));
	}

	async ack(stream: string, group: string, id: string): Promise<void> {
		await this.client.xack(stream, group, id);
	}

	async autoClaim(stream: string, group: string, consumer: string, minIdleMs: number, opts?: AutoClaimOptions): Promise<AutoClaimResult> {
		const argv = [stream, group, consumer, minIdleMs, opts?.start ?? '0-0', 'COUNT', opts?.count ?? 100] as const;

		const reply = (await this.client.xautoclaim(...(argv as unknown as Parameters<RedisClient['xautoclaim']>))) as XAutoClaimReply | null;
		if (!reply) return { entries: [], nextStart: '0-0' };

		const [nextStart, claimed] = reply;
		const entries = claimed.map(([id, , fields]) => ({ id, fields }));
		return { entries, nextStart };
	}

	async pendingCount(stream: string, group: string): Promise<number> {
		const reply = (await this.client.xpending(stream, group)) as XPendingSummary | null;
		if (!reply) return 0;
		return reply[0];
	}
}
