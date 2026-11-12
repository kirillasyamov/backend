import { CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

const EXCLUDED_PATHS = ['/health', '/healthz', '/docs', '/docs-yaml'];

interface LoggedRequest {
	method?: string;
	url?: string;
	user?: { sub?: string; role?: string };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger('HTTP');

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		if (context.getType() !== 'http') return next.handle();

		const request = context.switchToHttp().getRequest<LoggedRequest>();
		const path = request.url ?? '';
		if (EXCLUDED_PATHS.some(prefix => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`))) {
			return next.handle();
		}

		const method = request.method ?? 'UNKNOWN';
		const started = Date.now();
		const userId = request.user?.sub;
		const label = `${method} ${path}`;

		return next.handle().pipe(
			tap(() => {
				const status = context.switchToHttp().getResponse<{ statusCode?: number }>().statusCode ?? 200;
				this.logger.log(`${label} ${String(status)} ${String(Date.now() - started)}ms${userId ? ` user=${userId}` : ''}`);
			}),
			catchError((error: unknown) => {
				const status = this.toHttpStatus(error);
				const message = error instanceof Error ? error.message : String(error);
				this.logger.warn(`${label} ${String(status)} ${String(Date.now() - started)}ms${userId ? ` user=${userId}` : ''} error=${message}`);
				return throwError(() => error);
			}),
		);
	}

	private toHttpStatus(error: unknown): number {
		if (error instanceof HttpException) return error.getStatus();
		return 500;
	}
}
