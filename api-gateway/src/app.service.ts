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
	) {}

	async healthCheck() {
		const [authHealth, userHealth] = await Promise.all([this.ping(this.authClient), this.ping(this.userClient)]);

		return {
			'api-gateway': { health: true },
			'auth-service': { health: authHealth },
			'user-service': { health: userHealth },
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
