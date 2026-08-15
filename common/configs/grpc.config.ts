export interface GrpcServiceConfig {
	port: number;
	tokenServiceUrl: string;
}

export const grpcServiceConfig: GrpcServiceConfig = {
	get port() {
		return Number(process.env.GRPC_PORT) || 50051;
	},
	get tokenServiceUrl() {
		return process.env.TOKEN_SERVICE_URL ?? 'localhost:50004';
	},
};
