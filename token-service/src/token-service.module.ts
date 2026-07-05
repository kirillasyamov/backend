import { Module } from '@nestjs/common';
import { TokenServiceController } from './token-service.controller';
import { TokenService } from './token-service.service';

@Module({
  imports: [],
  controllers: [TokenServiceController],
  providers: [TokenService],
})
export class TokenServiceModule {}
