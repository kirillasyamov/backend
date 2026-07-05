import { Controller, Get } from '@nestjs/common';
import { TokenService } from './token-service.service';

@Controller()
export class TokenServiceController {
  constructor(private readonly tokenService: TokenService) {}

  @Get()
  getHello(): string {
    return this.tokenService.getHello();
  }
}
