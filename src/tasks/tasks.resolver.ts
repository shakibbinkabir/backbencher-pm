import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { TasksService } from './tasks.service';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { DependencyGraphService } from './dependency-graph.service';
import { SchedulingService } from './scheduling.service';
import { AssignmentResultType } from './types';

@Resolver()
export class TasksResolver {
  constructor(
    private readonly service: TasksService,
    private readonly dg: DependencyGraphService,
    private readonly scheduler: SchedulingService
  ) {}

  // Projects
  @Query(() => [Project])
  async projects(
    @Args('page', { type: () => Number, nullable: true }) page?: number,
    @Args('limit', { type: () => Number, nullable: true }) limit?: number,
    @Args('sort', { type: () => String, nullable: true }) sort?: string
  ) {
    const res = await this.service.listProjects({ page, limit, sort });
    return res.data;
  }

  @Query(() => Project)
  project(@Args('id') id: string) {
    return this.service.getProject(id);
  }

  @Mutation(() => Project)
  createProject(@Args('input') input: CreateProjectDto) {
    return this.service.createProject(input);
  }

  @Mutation(() => Project)
  updateProject(@Args('id') id: string, @Args('input') input: UpdateProjectDto) {
    return this.service.updateProject(id, input);
  }

  // Tasks
  @Query(() => [Task])
  async tasks(
    @Args('projectId', { type: () => String, nullable: true }) projectId?: string,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('priority', { type: () => String, nullable: true }) priority?: string,
    @Args('assigneeId', { type: () => String, nullable: true }) assigneeId?: string,
    @Args('page', { type: () => Number, nullable: true }) page?: number,
    @Args('limit', { type: () => Number, nullable: true }) limit?: number,
    @Args('sort', { type: () => String, nullable: true }) sort?: string
  ) {
    const res = await this.service.listTasks({ projectId, status, priority, assigneeId }, { page, limit, sort });
    return res.data;
  }

  @Query(() => Task)
  task(@Args('id') id: string) {
    return this.service.getTask(id);
  }

  @Mutation(() => Task)
  createTask(@Args('input') input: CreateTaskDto) {
    return this.service.createTask(input);
  }

  @Mutation(() => Task)
  updateTask(@Args('id') id: string, @Args('input') input: UpdateTaskDto) {
    return this.service.updateTask(id, input);
  }

  // Dependencies
  @Query(() => [Task], { description: 'Topologically ordered tasks for a project' })
  async dependencyOrder(@Args('projectId') projectId: string) {
    return this.dg.topologicalOrderForProject(projectId);
  }

  // Scheduling
  @Mutation(() => [AssignmentResultType], { description: 'Schedule tasks for a project; commit persists assignments if true' })
  async scheduleProject(@Args('projectId') projectId: string, @Args('commit', { type: () => Boolean, nullable: true }) commit?: boolean) {
    return this.scheduler.scheduleProject(projectId, !!commit);
  }
}
