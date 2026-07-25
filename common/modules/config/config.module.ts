import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import Joi from 'joi';

@Module({})
export class ConfigModule {
	static forRoot(...schemas: Joi.ObjectSchema[]): Promise<DynamicModule> {
		const env = process.env.NODE_ENV ?? 'development';

		return NestConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [`.env.${env}`, '.env'],
			expandVariables: true,
			validationSchema: schemas.length ? schemas.reduce((acc, s) => acc.concat(s), Joi.object()) : undefined,
			validationOptions: {
				allowUnknown: true,
				abortEarly: false,
			},
		});
	}
}
