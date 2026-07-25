import Joi from 'joi';

export const grpcSchema = Joi.object({
	GRPC_PORT: Joi.number().required(),
});
