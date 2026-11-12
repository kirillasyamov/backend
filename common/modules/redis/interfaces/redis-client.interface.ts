export interface RedisClient {
	get(key: string): Promise<string | null>;
	set(key: string, value: string | number | Buffer, mode?: 'EX', ttl?: number): Promise<unknown>;
	del(...keys: string[]): Promise<number>;
	exists(...keys: string[]): Promise<number>;
	scan(cursor: string, type?: 'MATCH', match?: string, countType?: 'COUNT', count?: number): Promise<[string, string[]]>;
	unlink(...keys: string[]): Promise<number>;
	quit(): Promise<'OK'>;
	xgroup(...args: unknown[]): Promise<unknown>;
	xreadgroup(...args: unknown[]): Promise<unknown>;
	xack(...args: unknown[]): Promise<unknown>;
	xautoclaim(...args: unknown[]): Promise<unknown>;
	xpending(...args: unknown[]): Promise<unknown>;
}
