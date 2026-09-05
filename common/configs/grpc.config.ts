import { Transport, type ClientsProviderAsyncOptions } from '@nestjs/microservices';

export interface GrpcServiceConfig {
	port: number;
	host: string;
	authServiceUrl: string;
	userServiceUrl: string;
	tokenServiceUrl: string;
	mediaServiceUrl: string;
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
	get mediaServiceUrl() {
		return process.env.MEDIA_SERVICE_URL ?? 'localhost:50006';
	},
	get grpcChannelOptions() {
		return {
			'grpc.service_config': JSON.stringify({
				loadBalancingConfig: [{ round_robin: {} }],
			}),
		};
	},
};

export interface IGrpcClientDescriptor {
	name: string | symbol;
	packages: string[];
	protoPaths: string[];
	url: string;
}

export const grpcClients = (descriptors: IGrpcClientDescriptor[]): ClientsProviderAsyncOptions[] =>
	descriptors.map(({ name, packages, protoPaths, url }) => ({
		name,
		useFactory: () => ({
			transport: Transport.GRPC,
			options: {
				package: packages,
				protoPath: protoPaths,
				url,
				channelOptions: grpcServiceConfig.grpcChannelOptions,
				loader: { defaults: true, arrays: true },
			},
		}),
	}));
