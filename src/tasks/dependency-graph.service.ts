import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';

@Injectable()
export class DependencyGraphService {
  constructor(@InjectRepository(Task) private readonly tasks: Repository<Task>) {}

  async loadProjectTasks(projectId: string): Promise<Task[]> {
    return this.tasks.find({
      where: { projectId },
      relations: ['dependencies']
    });
  }

  // Returns tasks in a valid execution order (dependencies before dependents).
  // Throws BadRequestException if cycles exist.
  async topologicalOrderForProject(projectId: string): Promise<Task[]> {
    const tasks = await this.loadProjectTasks(projectId);
    const cycle = this.findCycle(tasks);
    if (cycle.length) {
      throw new BadRequestException({ message: 'Dependency cycle detected', cycle });
    }
    return this.topoSort(tasks);
  }

  async validateProjectGraph(projectId: string): Promise<{ hasCycle: boolean; cycles: string[][] }> {
    const tasks = await this.loadProjectTasks(projectId);
    const cycles = this.findAllCycles(tasks);
    return { hasCycle: cycles.length > 0, cycles };
  }

  // Kahn's algorithm
  topoSort(tasks: Task[]): Task[] {
    const idToTask = new Map(tasks.map((t) => [t.id, t]));
    const indeg = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const t of tasks) {
      indeg.set(t.id, indeg.get(t.id) ?? 0);
      for (const d of t.dependencies || []) {
        indeg.set(t.id, (indeg.get(t.id) ?? 0) + 1);
        adj.set(d.id, [...(adj.get(d.id) || []), t.id]);
      }
    }

    const queue: string[] = [];
    for (const [id, deg] of indeg.entries()) if (deg === 0) queue.push(id);

    const order: Task[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      order.push(idToTask.get(id)!);
      for (const nxt of adj.get(id) || []) {
        const nd = (indeg.get(nxt) ?? 0) - 1;
        indeg.set(nxt, nd);
        if (nd === 0) queue.push(nxt);
      }
    }
    if (order.length !== tasks.length) {
      // cycle exists
      return [];
    }
    return order;
  }

  // Returns a single cycle (ids) if exists; else [].
  findCycle(tasks: Task[]): string[] {
    const color = new Map<string, number>(); // 0=unvisited,1=visiting,2=done
    const adj = new Map<string, string[]>();
    for (const t of tasks) adj.set(t.id, (t.dependencies || []).map((d) => d.id));

    const stack: string[] = [];
    const res: string[] = [];

    const dfs = (u: string): boolean => {
      color.set(u, 1);
      stack.push(u);
      for (const v of adj.get(u) || []) {
        if ((color.get(v) ?? 0) === 0) {
          if (dfs(v)) return true;
        } else if ((color.get(v) ?? 0) === 1) {
          // found back-edge, reconstruct cycle
          const cycle: string[] = [];
          for (let i = stack.length - 1; i >= 0; i--) {
            cycle.push(stack[i]);
            if (stack[i] === v) break;
          }
          res.push(...cycle.reverse());
          return true;
        }
      }
      stack.pop();
      color.set(u, 2);
      return false;
    };

    for (const t of tasks) {
      if ((color.get(t.id) ?? 0) === 0) {
        if (dfs(t.id)) break;
      }
    }
    return res;
  }

  // Naive all-cycles finder using DFS path capture (sufficient for small graphs)
  findAllCycles(tasks: Task[]): string[][] {
    const adj = new Map<string, string[]>();
    for (const t of tasks) adj.set(t.id, (t.dependencies || []).map((d) => d.id));

    const cycles: string[][] = [];
    const path: string[] = [];
    const visited = new Set<string>();

    const dfs = (u: string) => {
      path.push(u);
      visited.add(u);
      for (const v of adj.get(u) || []) {
        const idx = path.indexOf(v);
        if (idx !== -1) {
          cycles.push(path.slice(idx));
        } else if (!visited.has(v)) {
          dfs(v);
        }
      }
      path.pop();
      visited.delete(u);
    };

    for (const t of tasks) dfs(t.id);
    // Deduplicate cycles by normalized string
    const seen = new Set<string>();
    const unique: string[][] = [];
    for (const c of cycles) {
      const norm = c.slice().sort().join(',');
      if (!seen.has(norm)) {
        seen.add(norm);
        unique.push(c);
      }
    }
    return unique;
  }
}
