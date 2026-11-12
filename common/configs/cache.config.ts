export interface CacheConfig {
	host: string;
	port: number;
	password?: string;
}

export const cacheConfig: CacheConfig = {
	get host() {
		return process.env.REDIS_HOST ?? 'localhost';
	},
	get port() {
		return Number(process.env.REDIS_PORT) || 6379;
	},
	get password() {
		return process.env.REDIS_PASSWORD;
	},
};
