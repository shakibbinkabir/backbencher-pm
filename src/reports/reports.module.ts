import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsResolver } from './reports.resolver';
import { Task } from '../tasks/task.entity';
import { Project } from '../tasks/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project])],
  providers: [ReportsService], // ReportsResolver temporarily disabled
  controllers: [ReportsController],
  exports: [ReportsService]
})
export class ReportsModule {}
