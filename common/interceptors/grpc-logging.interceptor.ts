import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(GrpcLoggingInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		if (context.getType() !== 'rpc') return next.handle();

		const method = context.getHandler().name;
		const service = context.getClass().name;
		const label = `${service}.${method}`;
		const isHealth = method === 'check';
		const started = Date.now();

		return next.handle().pipe(
			tap(() => {
				const duration = Date.now() - started;
				if (isHealth) this.logger.debug(`${label} ok ${String(duration)}ms`);
				else this.logger.log(`${label} ok ${String(duration)}ms`);
			}),
			catchError((error: unknown) => {
				const duration = Date.now() - started;
				const message = error instanceof Error ? error.message : String(error);
				if (isHealth) this.logger.debug(`${label} failed ${String(duration)}ms: ${message}`);
				else this.logger.warn(`${label} failed ${String(duration)}ms: ${message}`);
				return throwError(() => error);
			}),
		);
	}
}
