import Joi from 'joi';

export const jwtSchema = Joi.object({
	JWT_PRIVATE_KEY: Joi.string().required(),
	JWT_PUBLIC_KEY: Joi.string().required(),
	JWT_ISSUER: Joi.string().default('token-service'),
});
