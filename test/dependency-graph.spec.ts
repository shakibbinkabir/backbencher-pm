import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DependencyGraphService } from '../src/tasks/dependency-graph.service';
import { Task } from '../src/tasks/task.entity';
import { Project } from '../src/tasks/project.entity';
import { User } from '../src/users/user.entity';

describe('DependencyGraphService', () => {
  let repoTask: Repository<Task>;
  let repoProject: Repository<Project>;
  let svc: DependencyGraphService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          synchronize: true,
          entities: [User, Project, Task]
        }),
  TypeOrmModule.forFeature([Task, Project])
      ],
      providers: [DependencyGraphService]
    }).compile();

  repoTask = mod.get(getRepositoryToken(Task));
  repoProject = mod.get(getRepositoryToken(Project));
    svc = mod.get(DependencyGraphService);
  });

  it('topo sort orders dependencies first and detects cycles', async () => {
    const p = await repoProject.save(repoProject.create({ name: 'P' }));

    const a = await repoTask.save(repoTask.create({ projectId: p.id, title: 'A' }));
    const b = await repoTask.save(repoTask.create({ projectId: p.id, title: 'B' }));
    const c = await repoTask.save(repoTask.create({ projectId: p.id, title: 'C' }));

    // B depends on A; C depends on B
    b.dependencies = [a];
    await repoTask.save(b);
    c.dependencies = [b];
    await repoTask.save(c);

    const order = await svc.topologicalOrderForProject(p.id);
    const ids = order.map((t) => t.title);
    expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('B'));
    expect(ids.indexOf('B')).toBeLessThan(ids.indexOf('C'));

    // introduce a cycle: A depends on C
    a.dependencies = [c];
    await repoTask.save(a);

    await expect(svc.topologicalOrderForProject(p.id)).rejects.toBeTruthy();
    const validation = await svc.validateProjectGraph(p.id);
    expect(validation.hasCycle).toBe(true);
    expect(validation.cycles.length).toBeGreaterThan(0);
  });
});
