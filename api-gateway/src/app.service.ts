import { Injectable, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { Observable } from 'rxjs';

interface HealthGrpcClient {
	check(request: { service: string }): Observable<{ status: number }>;
}

@Injectable()
export class GatewayService {
	constructor(
		@Inject('AUTH_PACKAGE') private authClient: ClientGrpc,
		@Inject('USER_PACKAGE') private userClient: ClientGrpc,
		@Inject('TOKEN_PACKAGE') private tokenClient: ClientGrpc,
	) {}

	async healthCheck() {
		const [authHealth, userHealth, tokenHealth] = await Promise.all([
			this.ping(this.authClient),
			this.ping(this.userClient),
			this.ping(this.tokenClient),
		]);

		return {
			'api-gateway': { health: true },
			'auth-service': { health: authHealth },
			'user-service': { health: userHealth },
			'token-service': { health: tokenHealth },
		};
	}

	private async ping(client: ClientGrpc): Promise<boolean> {
		try {
			const service = client.getService<HealthGrpcClient>('Health');
			const res = await firstValueFrom(service.check({ service: '' }));
			return res.status === 1;
		} catch {
			return false;
		}
	}
}
