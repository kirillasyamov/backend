import { Controller, Get, Post, Body } from '@nestjs/common';
import { GatewayService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class GatewayController {
	constructor(private readonly apiGatewayService: GatewayService) {}

	@Get()
	getInfo(): object {
		return { status: 'OK', timestamp: Date.now() };
	}
}
