export interface ApiGatewayConfig {
	host: string;
	port: number;
	corsOrigins: string[];
}

export const apiGatewayConfig: ApiGatewayConfig = {
	get host() {
		return process.env.HOST ?? '0.0.0.0';
	},
	get port() {
		return Number(process.env.PORT) || 3000;
	},
	get corsOrigins() {
		const raw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
		return raw
			.split(/\s+/)
			.map(origin => origin.trim())
			.filter(Boolean);
	},
};
