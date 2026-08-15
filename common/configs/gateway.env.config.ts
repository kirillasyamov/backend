export const apiGatewayConfig = {
	get host() {
		return process.env.HOST || 'localhost';
	},
	get port() {
		return Number(process.env.PORT) || 3000;
	},
};
