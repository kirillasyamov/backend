import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Observable, throwError } from 'rxjs';

const GRPC_STATUS_MAP: Record<string, number> = {
	P2002: status.ALREADY_EXISTS,
	P2025: status.NOT_FOUND,
};

@Catch()
export class GrpcExceptionFilter {
	private readonly logger = new Logger(GrpcExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost): Observable<never> {
		if (exception instanceof RpcException) {
			return throwError(() => exception.getError());
		}

		if (exception instanceof PrismaClientKnownRequestError) {
			const grpcCode = GRPC_STATUS_MAP[exception.code];
			const message = this.getPrismaMessage(exception);

			if (grpcCode) {
				this.logger.warn(`Prisma ${exception.code}: ${message}`);
				return throwError(() => ({ code: grpcCode, message }));
			}

			this.logger.error(`Prisma ${exception.code}: ${message}`);
			return throwError(() => ({ code: status.INTERNAL, message: 'Internal database error' }));
		}

		this.logger.error('Unhandled exception', exception as Error);
		return throwError(() => ({ code: status.INTERNAL, message: 'Internal server error' }));
	}

	private getPrismaMessage(error: PrismaClientKnownRequestError): string {
		const target = (error.meta?.target as string[] | undefined)?.join(', ');

		switch (error.code) {
			case 'P2002':
				return target ? `Unique constraint failed on: ${target}` : 'Unique constraint failed';
			case 'P2025':
				return 'Record not found';
			default:
				return error.message;
		}
	}
}
