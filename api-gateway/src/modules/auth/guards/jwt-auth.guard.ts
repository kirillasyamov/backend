import { CanActivate, ExecutionContext, Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { decodeJwt } from 'jose';
import type { TokenServiceClient } from 'common/contracts/generated/token';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
	private tokenGrpcService!: TokenServiceClient;

	constructor(
		private readonly reflector: Reflector,
		@Inject('TOKEN_PACKAGE') private readonly tokenClient: ClientGrpc,
	) {}

	onModuleInit() {
		this.tokenGrpcService = this.tokenClient.getService<TokenServiceClient>('TokenService');
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
		if (isPublic) return true;

		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);
		if (!token) throw new UnauthorizedException('Missing authentication token');

		try {
			const response = await firstValueFrom(this.tokenGrpcService.validateJwt({ jsonWebToken: token }));
			if (!response.isValid) throw new UnauthorizedException('Invalid or expired token');

			const payload = decodeJwt(token);
			request.user = payload;
			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) throw error;
			throw new UnauthorizedException('Token validation failed');
		}
	}

	private extractTokenFromHeader(request: any): string | undefined {
		const authHeader = request.headers?.authorization;
		if (!authHeader) return undefined;
		const [type, token] = authHeader.split(' ');
		return type === 'Bearer' ? token : undefined;
	}
}
