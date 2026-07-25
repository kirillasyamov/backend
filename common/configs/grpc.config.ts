export interface GrpcServiceConfig {
	port: number;
}

export const grpcServiceConfig: GrpcServiceConfig = {
	get port() {
		return Number(process.env.GRPC_PORT) || 50051;
	},
};
