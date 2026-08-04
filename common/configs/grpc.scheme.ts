import Joi from 'joi';

export const grpcSchema = Joi.object({
	GRPC_PORT: Joi.number().required(),
	GRPC_HOST: Joi.string().default('0.0.0.0'),
	AUTH_SERVICE_URL: Joi.string().default('localhost:50002'),
	USER_SERVICE_URL: Joi.string().default('localhost:50051'),
	TOKEN_SERVICE_URL: Joi.string().default('localhost:50004'),
});
