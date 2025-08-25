import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';
import { ProjectsController } from './projects.controller';
import { TasksController } from './tasks.controller';
import { TasksResolver } from './tasks.resolver';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, User])],
  providers: [TasksService, TasksResolver],
  controllers: [ProjectsController, TasksController]
})
export class TasksModule {}
