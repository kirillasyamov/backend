import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { GatewayModule } from './app.module';

import { apiGatewayConfig, buildSwaggerConfig } from '@kirillasyamov/common/configs';

const apiVersion = '1.0';

async function bootstrap() {
	const app = await NestFactory.create(GatewayModule, new FastifyAdapter());

	const logger = new Logger();

	app.enableCors({
		origin: apiGatewayConfig.corsOrigins,
		credentials: true,
	});
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

	const swaggerDocument = SwaggerModule.createDocument(app, buildSwaggerConfig(apiVersion));
	SwaggerModule.setup('/docs', app, swaggerDocument, { yamlDocumentUrl: '/docs-yaml' });

	app.enableShutdownHooks();

	const port = apiGatewayConfig.port;
	const host = apiGatewayConfig.host;

	await app.listen(port, host);

	logger.log(`Gateway is running on http://${host}:${String(port)}`);
	logger.log(`Swagger docs are available at http://${host}:${String(port)}/docs`);
}
void bootstrap();
