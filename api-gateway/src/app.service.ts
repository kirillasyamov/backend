import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IHealthGrpcClient } from './interfaces';
import { AUTH_PACKAGE, USER_PACKAGE, TOKEN_PACKAGE, GRPC_HEALTH_STATUS_SERVING } from './gateway.constants';

@Injectable()
export class GatewayService {
	private readonly logger = new Logger(GatewayService.name);

	constructor(
		@Inject(AUTH_PACKAGE) private authClient: ClientGrpc,
		@Inject(USER_PACKAGE) private userClient: ClientGrpc,
		@Inject(TOKEN_PACKAGE) private tokenClient: ClientGrpc,
	) {}

	async healthCheck() {
		const [authHealth, userHealth, tokenHealth] = await Promise.all([
			this.ping('auth-service', this.authClient),
			this.ping('user-service', this.userClient),
			this.ping('token-service', this.tokenClient),
		]);

		return {
			'api-gateway': { health: true },
			'auth-service': { health: authHealth },
			'user-service': { health: userHealth },
			'token-service': { health: tokenHealth },
		};
	}

	private async ping(name: string, client: ClientGrpc): Promise<boolean> {
		try {
			const service = client.getService<IHealthGrpcClient>('Health');
			const res = await firstValueFrom(service.check({ service: '' }));
			const healthy = res.status === GRPC_HEALTH_STATUS_SERVING;
			if (healthy) this.logger.debug(`Health check ok for ${name}`);
			return healthy;
		} catch (error) {
			this.logger.warn(`Health check failed for ${name}: ${(error as Error).message}`);
			return false;
		}
	}
}
