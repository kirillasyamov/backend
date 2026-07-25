import { Module } from '@nestjs/common';
import { TokenServiceController } from './token-service.controller';
import { TokenService } from './token-service.service';
import { ConfigModule } from 'common/modules/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [TokenServiceController],
  providers: [TokenService],
})
export class TokenServiceModule {}
