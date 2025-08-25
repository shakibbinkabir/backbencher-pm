import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from '../tasks/task.entity';
import { Project } from '../tasks/project.entity';
import { TaskStatus, TaskPriority } from '../tasks/task.enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(Project) private readonly projects: Repository<Project>
  ) {}

  async projectSummary(projectId: string) {
    // Ensure project exists
    const exists = await this.projects.findOne({ where: { id: projectId } });
    if (!exists) return { projectId, total: 0, byStatus: [], byPriority: [], overdue: 0 };

    const byStatusRaw = await this.tasks
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('t.projectId = :projectId', { projectId })
      .groupBy('t.status')
      .getRawMany();

    const byPriorityRaw = await this.tasks
      .createQueryBuilder('t')
      .select('t.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('t.projectId = :projectId', { projectId })
      .groupBy('t.priority')
      .getRawMany();

    const total = await this.tasks.count({ where: { projectId } });

    const overdue = await this.tasks
      .createQueryBuilder('t')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.dueDate IS NOT NULL')
      .andWhere('t.dueDate < NOW()')
      .andWhere('t.status != :done', { done: TaskStatus.DONE })
      .getCount();

    return {
      projectId,
      total,
      byStatus: byStatusRaw.map((r) => ({ key: r.status as TaskStatus, count: Number(r.count) })),
      byPriority: byPriorityRaw.map((r) => ({ key: r.priority as TaskPriority, count: Number(r.count) })),
      overdue
    };
  }

  // Burnup: for each day in window, total tasks created up to that day vs completed (DONE) up to that day (approx via updatedAt)
  async projectBurnup(projectId: string, days: number) {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - (days - 1));

    const points: { date: string; total: number; done: number }[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const total = await this.tasks
        .createQueryBuilder('t')
        .where('t.projectId = :projectId', { projectId })
        .andWhere('t.createdAt <= :eod', { eod: endOfDay })
        .getCount();

      const done = await this.tasks
        .createQueryBuilder('t')
        .where('t.projectId = :projectId', { projectId })
        .andWhere('t.status = :done', { done: TaskStatus.DONE })
        .andWhere('t.updatedAt <= :eod', { eod: endOfDay }) // approximation
        .getCount();

      points.push({ date: d.toISOString().slice(0, 10), total, done });
    }

    return { projectId, start: start.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10), points };
  }

  // Throughput: completed (DONE) tasks per day over the window (across all projects or filtered by projectId)
  async throughput(days: number, projectId?: string) {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - (days - 1));

    const baseQb = (): SelectQueryBuilder<Task> =>
      this.tasks
        .createQueryBuilder('t')
        .where('t.status = :done', { done: TaskStatus.DONE })
        .andWhere('t.updatedAt BETWEEN :start AND :end', {
          start: new Date(start.setHours(0, 0, 0, 0)),
          end: new Date(today.setHours(23, 59, 59, 999))
        });

    if (projectId) {
      baseQb().andWhere('t.projectId = :projectId', { projectId });
    }

    // We'll fetch once and aggregate in memory since window is small
    const rows = await this.tasks
      .createQueryBuilder('t')
      .select('DATE(t.updatedAt)', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('t.status = :done', { done: TaskStatus.DONE })
      .andWhere('t.updatedAt >= :start', { start: new Date(new Date().setDate(new Date().getDate() - (days - 1))) })
      .andWhere(projectId ? 't.projectId = :projectId' : '1=1', { projectId })
      .groupBy('DATE(t.updatedAt)')
      .orderBy('DATE(t.updatedAt)', 'ASC')
      .getRawMany();

    const map = new Map<string, number>();
    rows.forEach((r) => map.set(String(r.day), Number(r.count)));

    const points: { date: string; completed: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(new Date().getDate() - (days - 1 - i));
      const key = d.toISOString().slice(0, 10);
      points.push({ date: key, completed: map.get(key) || 0 });
    }

    return { projectId: projectId || null, points };
  }
}
