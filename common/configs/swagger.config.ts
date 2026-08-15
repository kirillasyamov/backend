import { DocumentBuilder } from '@nestjs/swagger';

export const buildSwaggerConfig = (apiVersion: string) => {
	return new DocumentBuilder().setTitle('API Routes for test app').setDescription('API Routes for test app').setVersion(apiVersion).addBearerAuth().build();
};
