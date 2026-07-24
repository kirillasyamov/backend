import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { GatewayModule } from './app.module';

import { apiGatewayConfig } from 'common/configs/gateway.env.config';
import { buildSwaggerConfig } from 'common/configs/swagger.config';

const apiVersion = '1.0';

async function bootstrap() {
	const app = await NestFactory.create(GatewayModule, new FastifyAdapter());

	const config = app.get(ConfigService);
	const logger = new Logger();

	app.enableCors({
		origin: 'http://localhost:3000',
		credetials: true,
	});
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

	const swaggerDocument = SwaggerModule.createDocument(app, buildSwaggerConfig(apiVersion));
	SwaggerModule.setup('/docs', app, swaggerDocument, { yamlDocumentUrl: '/docs-yaml' });

	const port = apiGatewayConfig.port;
	const host = apiGatewayConfig.host;

	await app.listen(port, host);

	logger.log(`Gateway is running on http://${host}:${port}`);
	logger.log(`Swagger docs are available at http://${host}:${port}/docs`);
}
bootstrap();
