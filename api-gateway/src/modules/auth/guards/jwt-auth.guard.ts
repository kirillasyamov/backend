import { CanActivate, ExecutionContext, Inject, Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { decodeJwt } from 'jose';
import type { TokenServiceClient } from '@kirillasyamov/common/contracts/generated/token';
import { IS_PUBLIC_KEY } from '../decorators';
import { IRequestWithUser } from '@/interfaces';
import { TOKEN_PACKAGE } from '@/gateway.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
	private readonly logger = new Logger(JwtAuthGuard.name);
	private tokenGrpcService!: TokenServiceClient;

	constructor(
		private readonly reflector: Reflector,
		@Inject(TOKEN_PACKAGE) private readonly tokenClient: ClientGrpc,
	) {}

	onModuleInit() {
		this.tokenGrpcService = this.tokenClient.getService<TokenServiceClient>('TokenService');
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
		if (isPublic) return true;

		const request = context.switchToHttp().getRequest<IRequestWithUser>();
		const token = this.extractTokenFromHeader(request);
		if (!token) {
			this.logger.debug('Rejecting request: missing auth token');
			throw new UnauthorizedException('Missing authentication token');
		}

		try {
			const response = await firstValueFrom(this.tokenGrpcService.validateJwt({ jsonWebToken: token }));
			if (!response.isValid) {
				this.logger.warn('Rejecting request: invalid or expired token');
				throw new UnauthorizedException('Invalid or expired token');
			}

			const payload = decodeJwt(token);
			request.user = payload;
			this.logger.debug(`Authenticated request: sub=${payload.sub ?? 'unknown'}`);
			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) throw error;
			this.logger.warn('Rejecting request: token validation failed');
			throw new UnauthorizedException('Token validation failed');
		}
	}

	private extractTokenFromHeader(request: IRequestWithUser): string | undefined {
		const authHeader = request.headers?.authorization;
		if (!authHeader) return undefined;
		const [type, token] = authHeader.split(' ');
		return type === 'Bearer' ? token : undefined;
	}
}
