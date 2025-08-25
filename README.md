# Backbencher PM — Phase 7 (Analytics, Reports, Metrics)

This phase adds:
- Prometheus metrics at `/metrics` with default process/node metrics plus HTTP request counters and latency histograms.
- Reports (REST + GraphQL):
  - Project summary: totals, by-status, by-priority, overdue count
  - Project burnup (daily): total vs done (approx. via updatedAt) over a window
  - Throughput (daily completes) across all projects or a single project

## Endpoints

- Metrics (no auth):
  - GET `/metrics` → Prometheus exposition format

- Reports (ADMIN/MANAGER only):
  - GET `/reports/project/:id/summary`
  - GET `/reports/project/:id/burnup?days=30` (1..120)
  - GET `/reports/throughput?days=30&projectId=<optional>`

## GraphQL

- Queries:
  - `projectSummary(projectId: String!): ProjectSummary`
  - `projectBurnup(projectId: String!, days: Int): BurnupSeries`
  - `throughput(days: Int, projectId: String): ThroughputSeries`

## Notes

- Burnup and throughput use `updatedAt` as a proxy for completion timestamp (status = DONE).
- Metrics labels: method, route (Express route path to limit cardinality), status.
- Metrics interceptor is global; exposed at `/metrics` for Prometheus scraping.

## Quick test

1. Start the app:
   ```
   docker compose up -d
   npm install
   npm run start:dev
   ```
2. Create a project and tasks; mark some as `DONE`.
3. Call:
   - `GET /reports/project/<id>/summary`
   - `GET /reports/project/<id>/burnup?days=14`
   - `GET /reports/throughput?days=14`
4. Visit `http://localhost:3000/metrics` to see Prometheus metrics.
