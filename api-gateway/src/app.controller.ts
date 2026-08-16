import { Controller, Get } from '@nestjs/common';
import { GatewayService } from './app.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators';
import { AppInfoResponseDto, HealthResponseDto, StatusResponseDto } from './dto';

@ApiTags('App')
@Controller()
export class GatewayController {
	constructor(private readonly gatewayService: GatewayService) {}

	@Get()
	@Public()
	@ApiOkResponse({ type: AppInfoResponseDto })
	getInfo(): AppInfoResponseDto {
		return { status: 'OK', timestamp: Date.now() };
	}

	@Get('health')
	@Public()
	@ApiOkResponse({ type: HealthResponseDto })
	async check(): Promise<HealthResponseDto> {
		return this.gatewayService.healthCheck();
	}

	@Get('healthz')
	@Public()
	@ApiOkResponse({ type: StatusResponseDto })
	checkz(): StatusResponseDto {
		return { status: 'OK' };
	}
}
