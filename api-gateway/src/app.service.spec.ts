import { Test } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import { of } from 'rxjs';
import type { ClientGrpc } from '@nestjs/microservices';
import { GatewayService } from './app.service';

interface HealthGrpcClient {
	check(request: { service: string }): { status: number };
}

const mockGrpcClient = (status: number): ClientGrpc => {
	const health = mockDeep<HealthGrpcClient>();
	health.check.mockReturnValue(of({ status }) as never);
	return { getService: () => health } as unknown as ClientGrpc;
};

describe('GatewayService', () => {
	it('healthCheck reports all services healthy', async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [
				GatewayService,
				{ provide: 'AUTH_PACKAGE', useValue: mockGrpcClient(1) },
				{ provide: 'USER_PACKAGE', useValue: mockGrpcClient(1) },
				{ provide: 'TOKEN_PACKAGE', useValue: mockGrpcClient(1) },
			],
		}).compile();
		const service = moduleRef.get(GatewayService);

		const result = await service.healthCheck();

		expect(result).toEqual({
			'api-gateway': { health: true },
			'auth-service': { health: true },
			'user-service': { health: true },
			'token-service': { health: true },
		});
	});

	it('healthCheck reports unhealthy when token service throws', async () => {
		const tokenClient = mockGrpcClient(0);
		const moduleRef = await Test.createTestingModule({
			providers: [
				GatewayService,
				{ provide: 'AUTH_PACKAGE', useValue: mockGrpcClient(1) },
				{ provide: 'USER_PACKAGE', useValue: mockGrpcClient(1) },
				{ provide: 'TOKEN_PACKAGE', useValue: tokenClient },
			],
		}).compile();
		const service = moduleRef.get(GatewayService);

		const result = await service.healthCheck();

		expect(result['token-service']).toEqual({ health: false });
		expect(result['auth-service']).toEqual({ health: true });
	});
});
