# Backbencher PM — Phase 0 Skeleton

This is the Phase 0 baseline for a NestJS project management backend with Swagger and GraphQL enabled, plus Docker Compose for local infra.

## Quick start (dev)

1. Copy env
   ```
   cp .env.example .env
   ```
2. Start infra and dev app (Docker Desktop must be running)
   ```
   docker compose up -d
   ```
3. Install deps locally (optional if you run inside container only)
   ```
   npm install
   ```
4. Run locally (without Docker app service)
   ```
   npm run start:dev
   ```
   Or rely on the `app` service already running in Docker.

5. Open:
   - Swagger: http://localhost:3000/docs
   - GraphQL: http://localhost:3000/graphql
   - Health: http://localhost:3000/health

## Services (docker-compose)

- Postgres 16: localhost:5432 (db: pm / user: postgres / pass: postgres)
- Redis 7: localhost:6379
- Elasticsearch 8: localhost:9200 (security disabled, single-node)

## Notes

- No domain modules yet. Auth/Users/Tasks/DB, Redis cache, and Elasticsearch usage come in later phases.
- Production build uses Dockerfile (multi-stage). For dev, the `app` service uses node:20-alpine and runs `npm run start:dev`.
