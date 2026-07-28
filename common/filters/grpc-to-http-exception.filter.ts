import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { grpcToHttpStatus } from './grpc-to-http-map';

@Catch()
export class GrpcToHttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(GrpcToHttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();

		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			const res = exception.getResponse();
			const message = typeof res === 'string' ? res : (res as Record<string, unknown>).message ?? exception.message;

			response.status(status).send({ statusCode: status, message });
			return;
		}

		let code: number | undefined;
		let message = 'Unknown error';

		if (exception instanceof RpcException) {
			const rpcError = exception.getError();
			code = typeof rpcError === 'object' && rpcError !== null
				? ((rpcError as Record<string, unknown>).code ?? (rpcError as Record<string, unknown>).status) as number
				: undefined;
			message = typeof rpcError === 'object' && rpcError !== null
				? ((rpcError as Record<string, unknown>).message || (rpcError as Record<string, unknown>).details || 'Unknown error') as string
				: typeof rpcError === 'string' ? rpcError : 'Unknown error';
		} else if (exception instanceof Error) {
			code = (exception as any).code ?? (exception as any).status;
			message = (exception as any).details || exception.message || 'Unknown error';
		}

		const httpStatus = grpcToHttpStatus[code as number] ?? HttpStatus.INTERNAL_SERVER_ERROR;

		this.logger.warn(`gRPC error [${code}]: ${message} → HTTP ${httpStatus}`);

		response.status(httpStatus).send({
			statusCode: httpStatus,
			message,
		});
	}
}
