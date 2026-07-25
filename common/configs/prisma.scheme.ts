import Joi from 'joi';

export const prismaSchema = Joi.object({
	DATABASE_URL: Joi.string().uri().required(),
});
