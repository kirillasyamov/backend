import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SignJWT, jwtVerify, importPKCS8, importSPKI, type JWTPayload } from 'jose';
import { randomUUID } from 'node:crypto';
import type { GenerateJWTRequest, GenerateJWTResponse, ValidateJWTRequest, ValidateJWTResponse, InvalidateJWTRequest } from 'common/contracts/generated/token';
import { jwtConfig } from 'common/configs/jwt.config';
import { BlacklistService } from './modules/blacklist/blacklist.service';

@Injectable()
export class TokenService {
	private readonly logger = new Logger(TokenService.name);
	private readonly alg = 'RS256' as const;
	private readonly kid = 'primary';

	constructor(private readonly blacklist: BlacklistService) {}

	public async generateJwt(request: GenerateJWTRequest): Promise<GenerateJWTResponse> {
		try {
			const privateKey = await importPKCS8(jwtConfig.privateKey, this.alg);
			const jwt = await new SignJWT({ ...request.extraClaims })
				.setProtectedHeader({ alg: this.alg, kid: this.kid })
				.setSubject(request.sub)
				.setAudience(request.aud)
				.setIssuer(jwtConfig.issuer)
				.setJti(randomUUID())
				.setIssuedAt()
				.setExpirationTime(`${String(request.ttlSeconds)}s`)
				.sign(privateKey);

			this.logger.debug(`Generated JWT for sub=${request.sub}, aud=${request.aud}`);

			return { jsonWebToken: jwt };
		} catch (error) {
			if (error instanceof RpcException) throw error;
			throw new RpcException({
				code: status.INTERNAL,
				message: 'Failed to generate JWT',
			});
		}
	}

	public async validateJwt(request: ValidateJWTRequest): Promise<ValidateJWTResponse> {
		try {
			const isBlacklisted = await this.blacklist.isBlacklisted(request.jsonWebToken);
			if (isBlacklisted) return { isValid: false };
			const publicKey = await importSPKI(jwtConfig.publicKey, this.alg);
			await jwtVerify(request.jsonWebToken, publicKey, { issuer: jwtConfig.issuer });
			return { isValid: true };
		} catch (error) {
			if (error instanceof RpcException) throw error;
			return { isValid: false };
		}
	}

	public async invalidateJwt(request: InvalidateJWTRequest): Promise<void> {
		try {
			const payload: JWTPayload = await this.decodeToken(request.jsonWebToken);
			if (!payload.exp) return;

			const now = Math.floor(Date.now() / 1000);
			const ttl = payload.exp - now;

			if (ttl <= 0) return;

			await this.blacklist.addToBlacklist(request.jsonWebToken, ttl);
			this.logger.debug(`Invalidated JWT with jti=${payload.jti ?? 'unknown'}, ttl=${String(ttl)}s`);
		} catch (error) {
			if (error instanceof RpcException) throw error;
			throw new RpcException({
				code: status.INTERNAL,
				message: 'Failed to invalidate JWT',
			});
		}
	}

	private async decodeToken(token: string): Promise<JWTPayload> {
		const { payload } = await jwtVerify(token, await importSPKI(jwtConfig.publicKey, this.alg), { issuer: jwtConfig.issuer });
		return payload;
	}
}
