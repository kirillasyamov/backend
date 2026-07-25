import Joi from 'joi';

export const apiGatewaySchema = Joi.object({
	PORT: Joi.string().required(),
	HOST: Joi.string().default('localhost'),
});
