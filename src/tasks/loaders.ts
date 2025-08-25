import { Provider, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { UsersService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { Repository, In } from 'typeorm';
import { User } from '../users/user.entity';

export const USER_LOADER = 'USER_LOADER';
export const TASKS_BY_PROJECT_LOADER = 'TASKS_BY_PROJECT_LOADER';

export const userLoaderProvider: Provider = {
  provide: USER_LOADER,
  scope: Scope.REQUEST,
  inject: [UsersService],
  useFactory: (users: UsersService) =>
    new DataLoader<string, User | null>(async (ids) => {
      const list = await users.findManyByIds(ids as string[]);
      const map = new Map(list.map((u) => [u.id, u]));
      return (ids as string[]).map((id) => map.get(id) ?? null);
    })
};

export const tasksByProjectLoaderProvider: Provider = {
  provide: TASKS_BY_PROJECT_LOADER,
  scope: Scope.REQUEST,
  inject: [getRepositoryToken(Task)],
  useFactory: (repo: Repository<Task>) =>
    new DataLoader<string, Task[]>(async (projectIds) => {
      const rows = await repo.findBy({ projectId: In(projectIds as string[]) });
      const grouped = new Map<string, Task[]>();
      for (const r of rows) {
        const arr = grouped.get(r.projectId) || [];
        arr.push(r);
        grouped.set(r.projectId, arr);
      }
      return (projectIds as string[]).map((id) => grouped.get(id) ?? []);
    })
};

export const loadersProviders: Provider[] = [userLoaderProvider, tasksByProjectLoaderProvider];
