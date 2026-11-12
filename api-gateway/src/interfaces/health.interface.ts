import type { Observable } from 'rxjs';

export interface IHealthGrpcClient {
	check(request: { service: string }): Observable<{ status: number }>;
}
