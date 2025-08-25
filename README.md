# Backbencher PM — Phase 4 (Real-time Notifications)

This phase adds real-time WebSocket notifications with Socket.IO and Redis adapter for horizontal scaling. Users receive instant updates when tasks and projects are created, updated, or deleted.

## Real-time Features

- **WebSocket Gateway**: JWT-authenticated connections
- **Room Management**: Users join project/task-specific rooms
- **Event Broadcasting**: Real-time notifications for CRUD operations
- **Redis Adapter**: Horizontal scaling support for multiple server instances

## WebSocket Events

### Client Events (Incoming)
- `join_room` - Join a project or task room
- `leave_room` - Leave a room
- `ping` - Health check

### Server Events (Outgoing)
- `connected` - Connection confirmation with user ID
- `notification` - Real-time notifications for task/project changes
- `room_joined` - Confirmation of room join
- `room_left` - Confirmation of room leave
- `pong` - Response to ping
- `error` - Error messages

### Notification Structure
```json
{
  "type": "task|project|user",
  "action": "created|updated|deleted|assigned|completed|status_changed",
  "data": { /* entity data */ },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "userId": "optional-user-id",
  "projectId": "optional-project-id",
  "taskId": "optional-task-id"
}
```

## WebSocket Connection

Connect to `ws://localhost:3000` with JWT authentication:

```javascript
const socket = io('ws://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});
```

## Room Structure

- `user_{userId}` - Personal notifications
- `project_{projectId}` - Project-wide notifications  
- `task_{taskId}` - Task-specific notifications

## REST endpoints

Auth required (Bearer token). RBAC: ADMIN/MANAGER can create/update/delete; authenticated users can read.

- Projects
  - POST `/projects` (ADMIN/MANAGER)
  - GET `/projects?page=1&limit=20&sort=createdAt:desc`
  - GET `/projects/:id`
  - PATCH `/projects/:id` (ADMIN/MANAGER)
  - DELETE `/projects/:id` (ADMIN/MANAGER)
  - POST `/projects/:id/validate-deps` — validate the dependency graph (detect cycles)
  - GET `/projects/:id/order` — get topological order of tasks (id, title)
  - POST `/projects/:id/schedule?commit=true|false` (ADMIN/MANAGER) — preview or commit scheduling results

- Tasks
  - POST `/tasks` (ADMIN/MANAGER)
  - body: `{ projectId, title, description?, status?, priority?, dueDate?, estimate?, timeSpent?, assigneeId?, dependencyIds?, tags?, requiredSkills? }`
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
  - `dependencyOrder(projectId: String!): [Task]` — tasks in topological order

- Mutations:
  - `createProject(input: CreateProjectDto): Project`
  - `updateProject(id: String!, input: UpdateProjectDto): Project`
  - `createTask(input: CreateTaskDto): Task`
  - `updateTask(id: String!, input: UpdateTaskDto): Task`
  - `scheduleProject(projectId: String!, commit?: Boolean): [AssignmentResultType]`

## Entities & Model extensions

- Project: `id, name, description?, createdAt, updatedAt, tasks[]`
- Task: `id, projectId, title, description?, status, priority, dueDate?, estimate, timeSpent, assigneeId?, dependencies[], requiredSkills?, createdAt, updatedAt`
- User: `id, email, roles[], skills?, weeklyCapacityHours, assignedHours, createdAt, updatedAt`

Notes:
- `requiredSkills` and `skills` are simple arrays (stored as simple-array in DB).
- `weeklyCapacityHours` defaults to 40; scheduler keeps a virtual `assignedHours` counter.
- Topological sort uses Kahn’s algorithm; cycle detection via DFS.

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

## Tests

Run:
```
npm run e2e
```

The test uses SQLite in-memory DB and covers:
- Manager login
- Project creation
- Task creation with dependencies
- Listing, updating, GraphQL fetch, and deletion
- Dependency graph unit test (topo order and cycle detection)
- Scheduling workflow (preview and commit)

## Try it

1. Install and build:
```
npm install
npm run build
```
2. Run tests:
```
npm test
npm run e2e
```

3. Dev server (optional):
```
npm run start:dev
```
