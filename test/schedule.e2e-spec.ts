import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { Role } from '../src/common/enums/role.enum';

describe('Scheduling (e2e)', () => {
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

    // Two candidates with skills
    const email1 = `alice${Date.now()}@example.com`;
    const email2 = `bob${Date.now()}@example.com`;
    await users.create({ email: email1, password: 'Pass123!' }, [Role.MANAGER]);
    await users.create({ email: email2, password: 'Pass123!' }, [Role.MANAGER]);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: email1, password: 'Pass123!' })
      .expect(201);
    token = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('schedules tasks and supports commit=false/true', async () => {
    // create project
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sched', description: 'Scheduling test' })
      .expect(201);
    const projectId = projectRes.body.id;

    // create tasks
    const t1 = (
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ projectId, title: 'Task 1', priority: 'HIGH', estimate: 8, requiredSkills: ['react'] })
        .expect(201)
    ).body;

    const t2 = (
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ projectId, title: 'Task 2', priority: 'CRITICAL', estimate: 4 })
        .expect(201)
    ).body;

    // make t2 depend on t1
    await request(app.getHttpServer())
      .patch(`/tasks/${t2.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dependencyIds: [t1.id] })
      .expect(200);

    // preview schedule
    const preview = await request(app.getHttpServer())
      .post(`/projects/${projectId}/schedule?commit=false`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(preview.body.committed).toBe(false);
    expect(Array.isArray(preview.body.results)).toBe(true);

    // commit schedule
    const commit = await request(app.getHttpServer())
      .post(`/projects/${projectId}/schedule?commit=true`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(commit.body.committed).toBe(true);
  });
});
