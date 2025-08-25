# Backbencher PM — NestJS (Phases 0–7)

A production‑shaped, modular NestJS backend for collaborative project management. It provides REST and GraphQL APIs, real‑time notifications, dependency resolution, a task scheduler, search with autocomplete, caching and N+1 avoidance, plus analytics and Prometheus metrics.

Status
- Implemented: Phases 0–7
  - Auth/RBAC, Projects/Tasks CRUD
  - Dependency resolution (topological sort) + cycle detection
  - Scheduler (priority/skills/capacity) with preview/commit
  - Realtime via Socket.IO (JWT on connect, project/task rooms), Redis adapter optional
  - Search + autocomplete (Elasticsearch)
  - Caching (Redis or in‑memory), GraphQL DataLoader
  - Analytics/Reports (summary, burnup, throughput), Prometheus /metrics
- Not implemented (time‑boxed): DB sharding/partitioning, message‑broker queues (RabbitMQ/Kafka), load testing (k6), PDF/CSV export, ≥90% coverage, TypeORM migrations (using synchronize=true for speed)

Frontend clarification
- The task’s “Frontend → Netlify/Vercel” appears under “Deployment & Documentation (Optional)”. A dedicated frontend UI was not required.
- This delivery focuses on a robust backend with:
  - Swagger UI (/docs) and GraphQL Playground (/graphql) for interactive testing
  - A ws-test script showing realtime events
- If a thin UI is desired, a Next.js SPA (auth, projects/tasks, WS updates) can be added in 1–2 days.

Contents
- Quick start (local)
- Features overview
- API surface (REST + GraphQL) and realtime events
- Scheduling & dependencies
- Search & autocomplete
- Caching & DataLoader
- Analytics & metrics
- Testing
- Deployment (see DEPLOYMENT.md for step‑by‑step)
- Gaps and next steps

--------------------------------------------------------------------------------

Quick start (local)

Prereqs
- Docker Desktop
- Node 20+, npm 9+
- Optional: jq (for shell JSON parsing), curl

Steps
1) Start infra
   docker compose up -d
2) Prepare env
   cp .env.example .env
   Set required:
   - JWT_SECRET=your_strong_secret
   - DATABASE_URL=postgres://postgres:postgres@localhost:5432/pm
   Optional:
   - REDIS_URL=redis://localhost:6379
   - ELASTICSEARCH_NODE=http://localhost:9200
   - THROTTLE_TTL=60
   - THROTTLE_LIMIT=120
3) Install & seed
   npm install
   npm run seed
4) Run
   npm run start:dev
5) Open
   - Swagger: http://localhost:3000/docs
   - GraphQL: http://localhost:3000/graphql
   - Health: http://localhost:3000/health
   - Metrics: http://localhost:3000/metrics

Default users (seed)
- admin@example.com / Password123!
- manager@example.com / Password123!

--------------------------------------------------------------------------------

Features overview

Architecture
- Modular monolith with clear modules:
  - AuthModule, UsersModule
  - TasksModule (Projects + Tasks)
  - NotificationsModule (Socket.IO WS)
  - SearchModule (Elasticsearch)
  - MetricsModule (Prometheus)
  - ReportsModule (analytics)
- TypeORM: PostgreSQL (dev/prod), SQLite in‑memory (tests)
- Throttler: rate limiting
- Helmet + CORS on

Core domain
- Projects and Tasks (status, priority, dueDate, estimate, requiredSkills, dependencies, assignee)
- Task dependencies with Many‑to‑Many join table (task_dependencies)
- Indices: tasks(projectId,status), tasks(projectId,priority)

Realtime
- Socket.IO Gateway, JWT verified on connect
- Rooms: project:<projectId>, task:<taskId>
- Events:
  - task.created, task.updated, task.deleted
  - task.assignment (assignee changed)
  - task.status (status changed)
- Redis adapter used when REDIS_URL is set

Dependencies & Scheduling
- Topological sort (Kahn + DFS cycle detection)
- Scheduler heuristic:
  - Sort by priority (CRITICAL > HIGH > MEDIUM > LOW), then dueDate
  - Match requiredSkills; respect weekly capacity; pick lowest load
  - Preview vs commit (commit persists assignee and updates assignedHours)

Search & Autocomplete
- Elasticsearch full‑text for projects/tasks
- Completion suggester for autocomplete
- Indexing on create/update/delete; no‑ops if ELASTICSEARCH_NODE is missing

Caching & GraphQL N+1
- CacheModule backed by Redis when REDIS_URL is set (fallback in‑memory)
- Route‑level TTLs on hot GET endpoints
- DataLoader for Task.assignee and Project.tasks

Analytics & Metrics
- Reports (REST + GraphQL):
  - Project summary (totals, byStatus, byPriority, overdue)
  - Burnup (daily total vs done)
  - Throughput (daily DONE count)
- Prometheus metrics at /metrics:
  - bbpm_http_requests_total
  - bbpm_http_request_duration_seconds
  - Node/process defaults

--------------------------------------------------------------------------------

API surface (high‑level)

REST (auth with Bearer token)
- Auth:
  - POST /auth/login
- Users:
  - GET /users/me
- Projects:
  - POST /projects (ADMIN, MANAGER)
  - GET /projects
  - GET /projects/:id
  - PATCH /projects/:id (ADMIN, MANAGER)
  - DELETE /projects/:id (ADMIN, MANAGER)
  - POST /projects/:id/validate-deps
  - GET /projects/:id/order
  - POST /projects/:id/schedule?commit=true|false (ADMIN, MANAGER)
- Tasks:
  - POST /tasks (ADMIN, MANAGER)
  - GET /tasks
  - GET /tasks/:id
  - PATCH /tasks/:id (ADMIN, MANAGER)
  - DELETE /tasks/:id (ADMIN, MANAGER)
- Search (requires ELASTICSEARCH_NODE):
  - GET /search?q=...&projectId=...
  - GET /search/autocomplete?q=...
- Reports (ADMIN, MANAGER):
  - GET /reports/project/:id/summary
  - GET /reports/project/:id/burnup?days=30
  - GET /reports/throughput?days=30&projectId=...
- Infra:
  - GET /health
  - GET /metrics (text/plain)

GraphQL (examples)
- Queries:
  - projects(page,limit,sort): [Project]
  - project(id: String!): Project
  - tasks(projectId,status,priority,assigneeId,page,limit,sort): [Task]
  - task(id: String!): Task
  - dependencyOrder(projectId: String!): [Task]
  - search(q: String!, projectId: String): SearchResults
  - autocomplete(q: String!): [String]
  - projectSummary(projectId: String!): ProjectSummary
  - projectBurnup(projectId: String!, days: Int): BurnupSeries
  - throughput(days: Int, projectId: String): ThroughputSeries
- Mutations:
  - createProject(input): Project
  - updateProject(id,input): Project
  - createTask(input): Task
  - updateTask(id,input): Task
  - scheduleProject(projectId: String!, commit: Boolean): [AssignmentResultType]

Realtime (Socket.IO)
- Connect: io('http://localhost:3000', { auth: { token: '<JWT>' } })
- Join/leave:
  - joinProject { projectId }
  - leaveProject { projectId }
  - joinTask { taskId }
  - leaveTask { taskId }
- Server emits:
  - task.created | task.updated | task.deleted | task.assignment | task.status

--------------------------------------------------------------------------------

End‑to‑end smoke test (CLI)

Login (manager)
- POST /auth/login with manager@example.com / Password123! → capture access_token

Create a project
- POST /projects with Authorization: Bearer <token>

Create tasks with dependency
- POST /tasks (first task)
- POST /tasks (second task with dependencyIds: [firstTaskId])

Validate deps + get order
- POST /projects/:id/validate-deps
- GET /projects/:id/order

Scheduler
- POST /projects/:id/schedule (preview)
- POST /projects/:id/schedule?commit=true (persist)

Realtime
- npm run ws:test → observe task.* events in console

Search (optional)
- GET /search?q=api&projectId=<id>
- GET /search/autocomplete?q=a

Reports & metrics
- GET /reports/project/:id/summary
- GET /reports/project/:id/burnup?days=14
- GET /reports/throughput?days=14&projectId=:id
- GET /metrics → Prometheus exposition

--------------------------------------------------------------------------------

Testing

- Unit:
  npm test
- E2E (SQLite in‑memory):
  npm run e2e

--------------------------------------------------------------------------------

Deployments

- See DEPLOYMENT.md for detailed steps.
- Render/Railway friendly. Works without Redis/Elasticsearch; those features gracefully no‑op if envs not set.

Required environment variables
- JWT_SECRET (required)
- DATABASE_URL (required in production)
- Optional:
  - REDIS_URL (Redis cache + WS adapter)
  - ELASTICSEARCH_NODE (search + autocomplete)
  - THROTTLE_TTL, THROTTLE_LIMIT
  - PORT (defaults to 3000)

--------------------------------------------------------------------------------

Gaps and next steps

- Replace synchronize=true with TypeORM migrations
- Add message‑broker queues (RabbitMQ/Kafka) or BullMQ for priority queue workflows
- DB sharding/partitioning strategy
- Load testing (k6) and CI (lint/test on PR)
- PDF/CSV exports for reports
- Dedicated frontend SPA (Next.js) if requested

License
- MIT