import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { grpcToHttpStatus } from './grpc-to-http-map';

interface GrpcErrorObject {
	code?: unknown;
	status?: unknown;
	message?: unknown;
	details?: unknown;
}

interface HttpResponse {
	status(code: number): HttpResponse;
	send(body: unknown): HttpResponse;
}

function toGrpcError(error: unknown): GrpcErrorObject {
	return typeof error === 'object' && error !== null ? error : {};
}

function toErrorMessage(value: unknown, fallback: string): string {
	return typeof value === 'string' ? value : fallback;
}

@Catch()
export class GrpcToHttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(GrpcToHttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const response = host.switchToHttp().getResponse<HttpResponse>();

		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			const res = exception.getResponse();
			const message = typeof res === 'string' ? res : toErrorMessage((res as Record<string, unknown>).message, exception.message);

			response.status(status).send({ statusCode: status, message });
			return;
		}

		let code: number | undefined;
		let message = 'Unknown error';

		if (exception instanceof RpcException) {
			const rpcError = toGrpcError(exception.getError());
			const rawCode = rpcError.code ?? rpcError.status;
			code = typeof rawCode === 'number' ? rawCode : undefined;
			message = toErrorMessage(rpcError.message ?? rpcError.details, 'Unknown error');
		} else if (exception instanceof Error) {
			const err = exception as Error & GrpcErrorObject;
			const rawCode = err.code ?? err.status;
			code = typeof rawCode === 'number' ? rawCode : undefined;
			message = toErrorMessage(err.details ?? err.message, 'Unknown error');
		}

		const httpStatus = (code !== undefined ? grpcToHttpStatus[code] : undefined) ?? HttpStatus.INTERNAL_SERVER_ERROR;

		this.logger.warn(`gRPC error [${String(code ?? 'unknown')}]: ${message} → HTTP ${String(httpStatus)}`);

		response.status(httpStatus).send({
			statusCode: httpStatus,
			message,
		});
	}
}
