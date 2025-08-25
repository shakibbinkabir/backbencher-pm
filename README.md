# Backbencher PM — Phase 2 (Projects & Tasks)

This phase adds core domain features: Projects and Tasks with REST and GraphQL, including dependencies, assignees, pagination, and sorting.

## REST endpoints

Auth required (Bearer token). RBAC: ADMIN/MANAGER can create/update/delete; authenticated users can read.

- Projects
  - POST `/projects` (ADMIN/MANAGER)
  - GET `/projects?page=1&limit=20&sort=createdAt:desc`
  - GET `/projects/:id`
  - PATCH `/projects/:id` (ADMIN/MANAGER)
  - DELETE `/projects/:id` (ADMIN/MANAGER)

- Tasks
  - POST `/tasks` (ADMIN/MANAGER)
    - body: `{ projectId, title, description?, status?, priority?, dueDate?, estimate?, timeSpent?, assigneeId?, dependencyIds?, tags? }`
  - GET `/tasks?projectId=<id>&status=TODO&priority=HIGH&assigneeId=<id>&page=1&limit=20&sort=createdAt:desc`
  - GET `/tasks/:id`
  - PATCH `/tasks/:id` (ADMIN/MANAGER)
  - DELETE `/tasks/:id` (ADMIN/MANAGER)

Notes:
- `dependencyIds` must reference tasks within the same project.
- `tags` is an array of strings.
- `estimate` and `timeSpent` are hours (integers).

## GraphQL

Playground at `/graphql`.

- Queries:
  - `projects(page, limit, sort): [Project]`
  - `project(id: String!): Project`
  - `tasks(projectId, status, priority, assigneeId, page, limit, sort): [Task]`
  - `task(id: String!): Task`

- Mutations:
  - `createProject(input: CreateProjectDto): Project`
  - `updateProject(id: String!, input: UpdateProjectDto): Project`
  - `createTask(input: CreateTaskDto): Task`
  - `updateTask(id: String!, input: UpdateTaskDto): Task`

## Entities

- Project: `id, name, description?, createdAt, updatedAt, tasks[]`
- Task: `id, projectId, title, description?, status, priority, dueDate?, estimate, timeSpent, assigneeId?, dependencies[], createdAt, updatedAt`

## Quick test flow

1. Start infra and app (from Phase 0):
   ```
   docker compose up -d
   npm install
   npm run start:dev
   ```
2. Get a MANAGER token:
   - Either seed (Phase 1) and login with `manager@example.com / Password123!`, or
   - Create a manager in test using `UsersService.create(..., [Role.MANAGER])`.
3. Create a project with POST `/projects`.
4. Create tasks and link `dependencyIds`.
5. List tasks with filters and pagination.
6. Try GraphQL queries/mutations.

## E2E tests

Run:
```
npm run e2e
```

The test uses SQLite in-memory DB and covers:
- Manager login
- Project creation
- Task creation with dependencies
- Listing, updating, GraphQL fetch, and deletion

## Next

Phase 3 will add dependency resolution (topological sort) and a basic scheduler that assigns tasks by priority/skills/availability.
