import Joi from 'joi';

export const authSchema = Joi.object({
	EXP_DAYS: Joi.number().default(30),
});
