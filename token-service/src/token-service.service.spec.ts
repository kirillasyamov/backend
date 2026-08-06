import { Test } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '@kirillasyamov/common';
import { TokenService } from './token-service.service';
import { BlacklistService } from './modules/blacklist/blacklist.service';

describe('TokenService', () => {
	let service: TokenService;
	let redis: ReturnType<typeof mockDeep<Redis>>;

	beforeEach(async () => {
		redis = mockDeep<Redis>();
		const moduleRef = await Test.createTestingModule({
			providers: [TokenService, BlacklistService, { provide: REDIS_CLIENT, useValue: redis }],
		}).compile();
		service = moduleRef.get(TokenService);
	});

	it('validateJwt returns invalid when token is blacklisted', async () => {
		redis.exists.mockResolvedValue(1);

		const result = await service.validateJwt({ jsonWebToken: 'blacklisted-token' });

		expect(result).toEqual({ isValid: false });
		expect(redis.exists).toHaveBeenCalledOnce();
	});

	it('generateJwt returns a signed JWT', async () => {
		const result = await service.generateJwt({ sub: 'user-1', aud: 'api-gateway', ttlSeconds: 60, extraClaims: {} });

		expect(result.jsonWebToken).toBeTypeOf('string');
		expect(result.jsonWebToken.split('.')).toHaveLength(3);
	});
});
