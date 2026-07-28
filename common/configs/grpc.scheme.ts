import Joi from 'joi';

export const grpcSchema = Joi.object({
	GRPC_PORT: Joi.number().required(),
	TOKEN_SERVICE_URL: Joi.string().default('localhost:50004'),
});
