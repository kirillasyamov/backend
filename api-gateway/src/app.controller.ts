import { Controller, Get } from '@nestjs/common';
import { GatewayService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class GatewayController {
	constructor(private readonly gatewayService: GatewayService) {}

	@Get()
	@ApiOperation({ summary: 'Welcome app endpoint' })
	getInfo(): object {
		return { status: 'OK', timestamp: Date.now() };
	}

	@Get('health')
	@ApiOperation({ summary: 'Health check' })
	check() {
		return this.gatewayService.healthCheck();
	}
}
