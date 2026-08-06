import Joi from 'joi';

export const apiGatewaySchema = Joi.object({
	PORT: Joi.string().required(),
	HOST: Joi.string().default('0.0.0.0'),
	CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
});
