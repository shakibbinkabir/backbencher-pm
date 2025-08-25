import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';
import { ProjectsController } from './projects.controller';
import { TasksController } from './tasks.controller';
import { TasksResolver } from './tasks.resolver';
import { DependencyGraphService } from './dependency-graph.service';
import { SchedulingService } from './scheduling.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, User]),
    forwardRef(() => NotificationsModule),
    SearchModule
  ],
  providers: [TasksService, TasksResolver, DependencyGraphService, SchedulingService],
  controllers: [ProjectsController, TasksController]
})
export class TasksModule {}
