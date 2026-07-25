import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TokenServiceModule } from './token-service.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenServiceModule);
  const config = app.get(ConfigService);
  await app.listen(config.get<number>('PORT', 3004));
}
bootstrap();
