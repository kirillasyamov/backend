export interface GrpcServiceConfig {
	port: number;
	host: string;
	authServiceUrl: string;
	userServiceUrl: string;
	tokenServiceUrl: string;
	grpcChannelOptions: Record<string, unknown>;
}

export const grpcServiceConfig: GrpcServiceConfig = {
	get port() {
		return Number(process.env.GRPC_PORT) || 50051;
	},
	get host() {
		return process.env.GRPC_HOST ?? '0.0.0.0';
	},
	get authServiceUrl() {
		return process.env.AUTH_SERVICE_URL ?? 'localhost:50002';
	},
	get userServiceUrl() {
		return process.env.USER_SERVICE_URL ?? 'localhost:50051';
	},
	get tokenServiceUrl() {
		return process.env.TOKEN_SERVICE_URL ?? 'localhost:50004';
	},
	get grpcChannelOptions() {
		return {
			'grpc.service_config': JSON.stringify({
				loadBalancingConfig: [{ round_robin: {} }],
			}),
		};
	},
};
