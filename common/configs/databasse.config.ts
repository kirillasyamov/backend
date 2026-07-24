export interface DatabaseConfig {
	host: string;
	port: number;
}

export const databaseConfig: DatabaseConfig = {
	get host() {
		return process.env.DB_HOST!;
	},
	get port() {
		return Number(process.env.DB_PORT) || 5432;
	},
};
