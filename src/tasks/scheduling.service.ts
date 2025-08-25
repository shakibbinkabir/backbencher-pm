import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { DependencyGraphService } from './dependency-graph.service';
import { TaskPriority, TaskStatus } from './task.enums';
import { Role } from '../common/enums/role.enum';

export interface AssignmentResult {
  taskId: string;
  assigneeId: string | null;
  assigneeEmail?: string;
  reason: string;
}

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dg: DependencyGraphService
  ) {}

  private priorityWeight(p: TaskPriority | undefined): number {
    switch (p) {
      case TaskPriority.CRITICAL:
        return 4;
      case TaskPriority.HIGH:
        return 3;
      case TaskPriority.MEDIUM:
        return 2;
      case TaskPriority.LOW:
      default:
        return 1;
    }
  }

  private hasAllSkills(candidate: User, required?: string[] | null): boolean {
    if (!required || required.length === 0) return true;
    const skillset = new Set((candidate.skills || []).map((s) => s.toLowerCase()));
    return required.every((r) => skillset.has(r.toLowerCase()));
  }

  // Returns proposed assignments ordered by dependency-aware priority.
  // If commit=true, persists assigneeId updates and increments assignedHours virtual workload.
  async scheduleProject(projectId: string, commit = false): Promise<AssignmentResult[]> {
    // Load users eligible for assignment (exclude VIEWER)
    const allUsers = await this.users.find();
    const candidates = allUsers.filter((u) => !(u.roles || []).includes(Role.VIEWER));

    // Build dependency-aware order
    const ordered = await this.dg.topologicalOrderForProject(projectId);

    // Consider only not-done tasks
    const ready = ordered.filter((t) => t.status !== TaskStatus.DONE);

    // Sort by priority weight desc, then dueDate asc
    ready.sort((a, b) => {
      const pd = this.priorityWeight(b.priority) - this.priorityWeight(a.priority);
      if (pd !== 0) return pd;
      const ad = (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity);
      return ad;
    });

    // Workload map (start with current assignedHours)
    const load = new Map<string, number>(candidates.map((c) => [c.id, c.assignedHours || 0]));

    const results: AssignmentResult[] = [];

    for (const t of ready) {
      // Choose best candidate: has all required skills, capacity not exceeded, lowest current load
      const req = t.requiredSkills || [];
      const feasible = candidates
        .filter((c) => this.hasAllSkills(c, req))
        .filter((c) => (load.get(c.id)! + (t.estimate || 0)) <= (c.weeklyCapacityHours || 40));

      const pool = feasible.length ? feasible : candidates; // fallback to anyone if no perfect match

      let best: User | null = null;
      let bestLoad = Number.MAX_SAFE_INTEGER;

      for (const c of pool) {
        const l = load.get(c.id)!;
        if (l < bestLoad) {
          best = c;
          bestLoad = l;
        }
      }

      if (best) {
        load.set(best.id, bestLoad + (t.estimate || 0));
        results.push({
          taskId: t.id,
          assigneeId: best.id,
          assigneeEmail: best.email,
          reason: feasible.length ? 'Matched skills and capacity' : 'No perfect match; selected lowest load'
        });
      } else {
        results.push({
          taskId: t.id,
          assigneeId: null,
          reason: 'No candidates available'
        });
      }
    }

    if (commit) {
      // Persist assignments and update assignedHours counters
      for (const r of results) {
        if (!r.assigneeId) continue;
        await this.tasks.update(r.taskId, { assigneeId: r.assigneeId });
        const u = candidates.find((c) => c.id === r.assigneeId);
        if (u) {
          u.assignedHours = (u.assignedHours || 0) + (ordered.find((x) => x.id === r.taskId)?.estimate || 0);
          await this.users.save(u);
        }
      }
    }

    return results;
  }
}
