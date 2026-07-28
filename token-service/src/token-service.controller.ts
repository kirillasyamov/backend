import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
	TokenServiceController as TokenServiceControllerInterface,
	GenerateJWTRequest,
	GenerateJWTResponse,
	ValidateJWTRequest,
	ValidateJWTResponse,
	InvalidateJWTRequest,
} from 'common/contracts/generated/token';
import { TokenServiceControllerMethods } from 'common/contracts/generated/token';
import { TokenService } from './token-service.service';

@Controller()
@TokenServiceControllerMethods()
export class TokenServiceController implements TokenServiceControllerInterface {
	constructor(private readonly tokenService: TokenService) {}

	@GrpcMethod('Health', 'Check')
	public async check(): Promise<{ status: number }> {
		return { status: 1 };
	}

	public async generateJwt(request: GenerateJWTRequest): Promise<GenerateJWTResponse> {
		return this.tokenService.generateJwt(request);
	}

	public async validateJwt(request: ValidateJWTRequest): Promise<ValidateJWTResponse> {
		return this.tokenService.validateJwt(request);
	}

	public async invalidateJwt(request: InvalidateJWTRequest): Promise<void> {
		return this.tokenService.invalidateJwt(request);
	}
}
