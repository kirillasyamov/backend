import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';

@Injectable()
export class GatewayService implements OnModuleInit {
	private authService: any;

	constructor(@Inject('AUTH_PACKAGE') private client: ClientGrpc) {}

	onModuleInit() {
		this.authService = this.client.getService('AuthService');
	}
}
