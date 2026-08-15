import { Controller, Get } from '@nestjs/common';
import { GatewayService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class GatewayController {
	constructor(private readonly gatewayService: GatewayService) {}

	@Get()
	@Public()
	@ApiOperation({ summary: 'App welcome endpoint' })
	getInfo(): object {
		return { status: 'OK', timestamp: Date.now() };
	}

	@Get('health')
	@Public()
	@ApiOperation({ summary: 'Health check' })
	check() {
		return this.gatewayService.healthCheck();
	}
}
