# Backbencher PM — Phase 1 (AuthN/AuthZ and RBAC)

This phase adds JWT authentication, User entity, role-based access control, and a seed script for admin/manager users.

## What’s included

- TypeORM configured: Postgres in development, SQLite in-memory for tests.
- Modules:
   - Auth: signup/login, JWT issuance
   - Users: current user (`GET /users/me`) and admin/manager-only list (`GET /users`)
   - Common: Roles decorator and RolesGuard
- Guards:
   - `JwtAuthGuard` (Passport JWT)
   - `RolesGuard` (checks `@Roles(...)`)
- Seed script to insert:
   - admin@example.com (role: ADMIN)
   - manager@example.com (role: MANAGER)
   - Default password: `Password123!`
- Tests:
   - E2E: signup → login → access protected endpoints

## Running locally

1. Ensure Docker infra is up (from Phase 0):
    ```
    docker compose up -d
    ```
2. Copy env if not already:
    ```
    cp .env.example .env
    ```
    Set `JWT_SECRET` to a secure value.
3. Install deps:
    ```
    npm install
    ```
4. Start dev server:
    ```
    npm run start:dev
    ```
5. Try endpoints (Swagger available at `/docs`):
    - POST `http://localhost:3000/auth/signup` { email, password }
    - POST `http://localhost:3000/auth/login` { email, password } → `{ access_token }`
    - GET `http://localhost:3000/users/me` with `Authorization: Bearer <token>`
    - GET `http://localhost:3000/users` with ADMIN/MANAGER token

## Seeding admin/manager

```
npm run seed
```

Creates users if they don’t exist:
- admin@example.com / Password123! (ADMIN)
- manager@example.com / Password123! (MANAGER)

## Testing

- Unit/integration:
   ```
   npm test
   ```
- E2E:
   ```
   npm run e2e
   ```

Note: Tests use SQLite in-memory; no Docker services needed for running tests.

## Next

Phase 2 will add Projects and Tasks (CRUD via REST/GraphQL) atop this Auth foundation.
