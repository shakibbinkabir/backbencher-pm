import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { Role } from '../src/common/enums/role.enum';
import { TaskStatus } from '../src/tasks/task.enums';

describe('Projects & Tasks (e2e)', () => {
  let app: INestApplication;
  let users: UsersService;
  let token: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    users = app.get(UsersService);

    // Create a MANAGER user directly via service, then login through API
    const email = `manager${Date.now()}@example.com`;
    const password = 'Password123!';
    await users.create({ email, password }, [Role.MANAGER]);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    token = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a project, add tasks with dependencies, list and update', async () => {
    // create project
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alpha', description: 'Test project' })
      .expect(201);
    const projectId = projectRes.body.id;

    // create first task
    const t1Res = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, title: 'Design schema', priority: 'HIGH' })
      .expect(201);
    const t1 = t1Res.body;

    // create second task depending on first
    const t2Res = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, title: 'Implement API', dependencyIds: [t1.id], priority: 'CRITICAL' })
      .expect(201);
    const t2 = t2Res.body;

    // list tasks by project
    const listRes = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&page=1&limit=10&sort=priority:desc`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listRes.body.total).toBe(2);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    // update task status
    const updRes = await request(app.getHttpServer())
      .patch(`/tasks/${t1.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: TaskStatus.IN_PROGRESS })
      .expect(200);
    expect(updRes.body.status).toBe(TaskStatus.IN_PROGRESS);

    // GraphQL: fetch project with tasks
    const gql = `
      query($id: String!) {
        project(id: $id) { id name }
        tasks(projectId: $id) { id title }
      }
    `;
    const gqlRes = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: gql, variables: { id: projectId } })
      .expect(200);
    expect(gqlRes.body.data.project.id).toBe(projectId);
    expect(gqlRes.body.data.tasks.length).toBe(2);

    // delete a task
    await request(app.getHttpServer())
      .delete(`/tasks/${t2.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
