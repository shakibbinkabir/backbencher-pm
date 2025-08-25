import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { DependencyGraphService } from './dependency-graph.service';
import { SchedulingService } from './scheduling.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Task } from './task.entity';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly service: TasksService,
    private readonly dg: DependencyGraphService,
    private readonly scheduler: SchedulingService
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.service.createProject(dto);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(10)
  @Get()
  list(@Query() pq: PaginationQueryDto) {
    return this.service.listProjects(pq);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getProject(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.updateProject(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.deleteProject(id);
    return { success: true };
  }

  // Dependency validation
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(15)
  @Post(':id/validate-deps')
  async validateDeps(@Param('id') id: string) {
    return this.dg.validateProjectGraph(id);
  }

  // Topological order
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(20)
  @Get(':id/order')
  async order(@Param('id') id: string) {
  const tasks = await this.dg.topologicalOrderForProject(id);
  return tasks.map((t: Task) => ({ id: t.id, title: t.title }));
  }

  // Scheduling
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post(':id/schedule')
  async schedule(@Param('id') id: string, @Query('commit') commit?: string) {
    const doCommit = (commit || '').toLowerCase() === 'true';
    const results = await this.scheduler.scheduleProject(id, doCommit);
    return { committed: doCommit, results };
  }
}
