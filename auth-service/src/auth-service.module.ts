import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthService } from './auth-service.service';

@Module({
  imports: [],
  controllers: [AuthServiceController],
  providers: [AuthService],
})
export class AuthServiceModule {}
