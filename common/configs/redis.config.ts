export interface RedisConfig {
	host: string;
	port: number;
	password?: string;
}

export const redisConfig: RedisConfig = {
	get host() {
		return process.env.REDIS_HOST ?? 'localhost';
	},
	get port() {
		return Number(process.env.REDIS_PORT) || 6379;
	},
	get password() {
		return process.env.REDIS_PASSWORD || undefined;
	},
};
