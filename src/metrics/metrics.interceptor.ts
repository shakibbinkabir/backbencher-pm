import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = process.hrtime.bigint();
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const method = (req?.method || 'UNKNOWN').toUpperCase();

    // Try to use the Express route path to limit cardinality; fallback to originalUrl
    const route = (req?.route?.path as string) || (req?.originalUrl as string) || 'unknown';

    return next.handle().pipe(
      tap(() => {
        const status = String(res?.statusCode || 200);
        const elapsedNs = Number(process.hrtime.bigint() - now);
        const seconds = elapsedNs / 1e9;

        this.metrics.httpRequestsTotal.labels(method, route, status).inc();
        this.metrics.httpRequestDuration.labels(method, route, status).observe(seconds);
      })
    );
  }
}
