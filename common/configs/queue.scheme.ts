import Joi from 'joi';

export const queueSchema = Joi.object({
	RESET_INTERVAL_MINUTES: Joi.number().integer().min(1).default(10),
});
