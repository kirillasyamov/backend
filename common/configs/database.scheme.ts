import Joi from 'joi';

export const databaseSchema = Joi.object({
	DB_HOST: Joi.string().required(),
	DB_PORT: Joi.number().default(5432),
});
