import Joi from 'joi';

export const redisSchema = Joi.object({
	REDIS_HOST: Joi.string().default('localhost'),
	REDIS_PORT: Joi.number().default(6379),
	REDIS_PASSWORD: Joi.string().allow('').optional(),
});
