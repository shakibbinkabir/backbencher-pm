import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: TasksService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.service.createProject(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Query() pq: PaginationQueryDto) {
    return this.service.listProjects(pq);
  }

  @UseGuards(JwtAuthGuard)
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
}
