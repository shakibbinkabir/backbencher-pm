import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { User } from '../users/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(User) private readonly users: Repository<User>
  ) {}

  // Projects
  async createProject(dto: CreateProjectDto): Promise<Project> {
    const p = this.projects.create(dto);
    return this.projects.save(p);
  }

  async listProjects(pq: PaginationQueryDto): Promise<{ data: Project[]; total: number; page: number; limit: number }> {
    const page = pq.page ?? 1;
    const limit = pq.limit ?? 20;
    const [sortField, sortDir] = (pq.sort ?? 'createdAt:desc').split(':') as [keyof Project, 'asc' | 'desc'];
    const [data, total] = await this.projects.findAndCount({
      order: { [sortField]: sortDir.toUpperCase() as any },
      skip: (page - 1) * limit,
      take: limit
    });
    return { data, total, page, limit };
  }

  async getProject(id: string): Promise<Project> {
    const p = await this.projects.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  async updateProject(id: string, dto: UpdateProjectDto): Promise<Project> {
    const p = await this.getProject(id);
    Object.assign(p, dto);
    return this.projects.save(p);
  }

  async deleteProject(id: string): Promise<void> {
    const res = await this.projects.delete(id);
    if (!res.affected) throw new NotFoundException('Project not found');
  }

  // Tasks
  async createTask(dto: CreateTaskDto): Promise<Task> {
    // Validate project
    const project = await this.projects.findOne({ where: { id: dto.projectId } });
    if (!project) throw new BadRequestException('Invalid projectId');

    // Validate assignee
    let assignee: User | null = null;
    if (dto.assigneeId) {
      assignee = await this.users.findOne({ where: { id: dto.assigneeId } });
      if (!assignee) throw new BadRequestException('Invalid assigneeId');
    }

    // Validate dependencies
    let dependencies: Task[] = [];
    if (dto.dependencyIds?.length) {
      dependencies = await this.tasks.findBy({ id: In(dto.dependencyIds) });
      if (dependencies.length !== dto.dependencyIds.length) throw new BadRequestException('One or more dependencyIds are invalid');
      const wrongProject = dependencies.find((t) => t.projectId !== dto.projectId);
      if (wrongProject) throw new BadRequestException('Dependencies must belong to the same project');
    }

    const entity = this.tasks.create({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      estimate: dto.estimate ?? 0,
      timeSpent: dto.timeSpent ?? 0,
      tags: dto.tags,
  requiredSkills: dto.requiredSkills,
      projectId: dto.projectId,
      assigneeId: dto.assigneeId ?? null,
      dependencies
    });
    return this.tasks.save(entity);
  }

  async getTask(id: string): Promise<Task> {
    const t = await this.tasks.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Task not found');
    return t;
  }

  async listTasks(
    filter: { projectId?: string; status?: string; priority?: string; assigneeId?: string },
    pq: PaginationQueryDto
  ): Promise<{ data: Task[]; total: number; page: number; limit: number }> {
    const page = pq.page ?? 1;
    const limit = pq.limit ?? 20;
    const [sortField, sortDir] = (pq.sort ?? 'createdAt:desc').split(':') as [keyof Task, 'asc' | 'desc'];

    const qb = this.tasks.createQueryBuilder('task');
    if (filter.projectId) qb.andWhere('task.projectId = :projectId', { projectId: filter.projectId });
    if (filter.status) qb.andWhere('task.status = :status', { status: filter.status });
    if (filter.priority) qb.andWhere('task.priority = :priority', { priority: filter.priority });
    if (filter.assigneeId) qb.andWhere('task.assigneeId = :assigneeId', { assigneeId: filter.assigneeId });

    qb.orderBy(`task.${sortField}`, sortDir.toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
    const t = await this.getTask(id);

    if (dto.assigneeId) {
      const assignee = await this.users.findOne({ where: { id: dto.assigneeId } });
      if (!assignee) throw new BadRequestException('Invalid assigneeId');
      t.assigneeId = dto.assigneeId;
    } else if (dto.assigneeId === null as any) {
      t.assigneeId = null;
    }

    if (dto.dependencyIds) {
      const deps = await this.tasks.findBy({ id: In(dto.dependencyIds) });
      if (deps.length !== dto.dependencyIds.length) throw new BadRequestException('One or more dependencyIds are invalid');
      const wrongProject = deps.find((x) => x.projectId !== t.projectId);
      if (wrongProject) throw new BadRequestException('Dependencies must belong to the same project');
      t.dependencies = deps;
    }

    Object.assign(t, {
      title: dto.title ?? t.title,
      description: dto.description ?? t.description,
      status: dto.status ?? t.status,
      priority: dto.priority ?? t.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : t.dueDate,
      estimate: dto.estimate ?? t.estimate,
      timeSpent: dto.timeSpent ?? t.timeSpent,
  tags: dto.tags ?? t.tags,
  requiredSkills: dto.requiredSkills ?? t.requiredSkills
    });

    return this.tasks.save(t);
  }

  async deleteTask(id: string): Promise<void> {
    const res = await this.tasks.delete(id);
    if (!res.affected) throw new NotFoundException('Task not found');
  }
}
