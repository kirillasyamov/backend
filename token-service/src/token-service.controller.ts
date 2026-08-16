import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
	TokenServiceControllerMethods,
	type TokenServiceController as TokenServiceControllerInterface,
	type GenerateJWTRequest,
	type GenerateJWTResponse,
	type ValidateJWTRequest,
	type ValidateJWTResponse,
	type InvalidateJWTRequest,
} from '@kirillasyamov/common/contracts/generated/token';
import { TokenService } from './token-service.service';
import { HEALTH_STATUS_SERVING } from './token-service.constants';

@Controller()
@TokenServiceControllerMethods()
export class TokenServiceController implements TokenServiceControllerInterface {
	constructor(private readonly tokenService: TokenService) {}

	@GrpcMethod('Health', 'Check')
	public check(): { status: number } {
		return { status: HEALTH_STATUS_SERVING };
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
