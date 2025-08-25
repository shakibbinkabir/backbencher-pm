import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('project/:id/summary')
  summary(@Param('id') id: string) {
    return this.reports.projectSummary(id);
  }

  @Get('project/:id/burnup')
  burnup(@Param('id') id: string, @Query('days', new ParseIntPipe()) days = 30) {
    return this.reports.projectBurnup(id, Math.max(1, Math.min(days, 120)));
  }

  @Get('throughput')
  throughput(@Query('days', new ParseIntPipe()) days = 30, @Query('projectId') projectId?: string) {
    return this.reports.throughput(Math.max(1, Math.min(days, 120)), projectId);
  }
}
