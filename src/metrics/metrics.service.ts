import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDuration: Histogram<string>;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry, prefix: 'bbpm_' });

    this.httpRequestsTotal = new Counter({
      name: 'bbpm_http_requests_total',
      help: 'Total number of HTTP requests',
      registers: [this.registry],
      labelNames: ['method', 'route', 'status'] as const
    });

    this.httpRequestDuration = new Histogram({
      name: 'bbpm_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      registers: [this.registry],
      labelNames: ['method', 'route', 'status'] as const,
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
    });
  }

  getRegistry(): Registry {
    return this.registry;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
