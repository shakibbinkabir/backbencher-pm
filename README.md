# BackBencher PM

A **NestJS**-based Project Management system with real-time updates, intelligent search, caching, and GraphQL optimizations.

## Features

### Phase 6: Caching & Performance Optimization
- **Redis-backed Caching**: Route-level caching with TTL-based eventual consistency
- **GraphQL N+1 Elimination**: DataLoader for batched User and Task fetches
- **Smart TTL Strategy**: Optimized cache durations (5-30s) for different endpoint types
- **Performance Optimizations**: Request-scoped providers for batching

### Previous Phases
- **Authentication & Authorization**: JWT-based auth with role-based access control (ADMIN/MANAGER/USER)
- **Task Management**: Full CRUD operations with status tracking, priority levels, and project organization
- **Dependency Management**: Task dependencies with cycle detection and validation
- **Scheduling**: Intelligent task scheduling with topological ordering
- **Real-time Updates**: WebSocket connections for live task updates
- **Search & Discovery**: Full-text search with Elasticsearch, autocomplete, and semantic matching

## Architecture

### Caching Layer
- **Redis Store**: Primary cache with memory fallback
- **Route-level Caching**: 
  - Search endpoints: 5s TTL
  - Task/Project lists: 10s TTL
  - Dependency validation: 15s TTL
  - Scheduling operations: 20s TTL
  - Individual resources: 30s TTL

### GraphQL Optimization
- **DataLoader Pattern**: Batched loading for related entities
- **Request-scoped Providers**: Prevents duplicate queries within single request
- **N+1 Elimination**: Automatic batching for User and Task associations

### Technology Stack
- **Backend**: NestJS, TypeScript, TypeORM
- **Database**: PostgreSQL with Redis for caching
- **Search**: Elasticsearch with fallback to PostgreSQL
- **Real-time**: Socket.IO with Redis adapter for scaling
- **API**: REST + GraphQL hybrid approach
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd backbencher-pm
   npm install
   ```

2. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run start:dev
   ```

### API Endpoints

#### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration

#### Projects (Cached)
- `GET /projects` - List projects (10s TTL)
- `GET /projects/:id` - Get project (30s TTL)
- `GET /projects/:id/validate-dependencies` - Validate deps (15s TTL)
- `GET /projects/:id/optimal-ordering` - Get task order (20s TTL)
- `POST /projects` - Create project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

#### Tasks (Cached)
- `GET /tasks` - List tasks (10s TTL)
- `GET /tasks/:id` - Get task (30s TTL)
- `POST /tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

#### Search (Cached)
- `GET /search?q=...` - Full-text search (5s TTL)
- `GET /search/autocomplete?q=...` - Autocomplete suggestions (5s TTL)

#### GraphQL
- `/graphql` - GraphQL playground and endpoint
- Optimized queries with DataLoader batching

#### Real-time
- WebSocket connections at `/socket.io/`
- Automatic task update broadcasts
- Redis-scaled connections

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/backbencher
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Search (Optional)
ELASTICSEARCH_URL=http://localhost:9200

# Server
PORT=3000
NODE_ENV=development
```

## Performance Features

### Caching Strategy
- **Hot Data Caching**: Frequently accessed endpoints cached with Redis
- **TTL-based Invalidation**: Short cache durations for eventual consistency
- **Intelligent Fallback**: Memory cache when Redis unavailable
- **Cache-aside Pattern**: Manual cache management for complex operations

### GraphQL Optimizations
- **DataLoader Batching**: Automatic query batching within request scope
- **N+1 Query Prevention**: Eliminates redundant database calls
- **Efficient Associations**: Optimized loading for User and Task relations

### Real-time Performance
- **Redis Pub/Sub**: Scalable WebSocket message distribution
- **Connection Pooling**: Efficient database connection management
- **Async Processing**: Non-blocking operations for better throughput

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Docker Deployment

```bash
# Build and run
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## Development

### Code Style
- ESLint + Prettier configuration
- TypeScript strict mode
- Consistent naming conventions

### Database Migrations
```bash
npm run migration:generate -- MigrationName
npm run migration:run
```

## License

MIT License - see LICENSE file for details.
