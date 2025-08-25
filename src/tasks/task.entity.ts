import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Project } from './project.entity';
import { TaskPriority, TaskStatus } from './task.enums';
import { User } from '../users/user.entity';

@ObjectType()
@Entity('tasks')
@Index(['projectId', 'status'])
@Index(['projectId', 'priority'])
export class Task {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string; // Unique identifier for the task

  @Field(() => String)
  @Column({ type: 'varchar', length: 255 })
  title!: string; // Title of the task

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string | null; // Description of the task

  @Field(() => TaskStatus)
  @Column({ type: 'varchar', length: 20, default: TaskStatus.TODO })
  status!: TaskStatus; // Current status of the task

  @Field(() => TaskPriority)
  @Column({ type: 'varchar', length: 20, default: TaskPriority.MEDIUM })
  priority!: TaskPriority; // Priority level of the task

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date | null; // Due date for the task

  @Field(() => Number, { nullable: true, description: 'Estimated hours' })
  @Column({ type: 'int', default: 0 })
  estimate!: number; // Estimated hours to complete the task

  @Field(() => Number, { nullable: true, description: 'Time spent in hours' })
  @Column({ type: 'int', default: 0 })
  timeSpent!: number; // Actual time spent on the task

  // Stored as comma-separated in DB; expose as array
  @Field(() => [String], { nullable: true })
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[] | null; // Tags associated with the task

  // Required skills for scheduling (comma-separated)
  @Field(() => [String], { nullable: true })
  @Column({ type: 'simple-array', nullable: true })
  requiredSkills?: string[] | null; // Skills required to work on the task

  @Field(() => Project)
  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'projectId' })
  project!: Project; // Project to which the task belongs

  @Field(() => String)
  @Column({ type: 'uuid' })
  projectId!: string; // ID of the project associated with the task

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'assigneeId' })
  assignee?: User | null; // User assigned to the task

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  assigneeId?: string | null; // ID of the user assigned to the task

  @Field(() => [Task], { description: 'Tasks that this task depends on' })
  @ManyToMany(() => Task, (t) => t.dependents, { cascade: false })
  @JoinTable({
    name: 'task_dependencies',
    joinColumn: { name: 'taskId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'dependsOnId', referencedColumnName: 'id' }
  })
  dependencies!: Task[]; // Tasks that this task depends on

  @Field(() => [Task], { description: 'Tasks that depend on this task' })
  @ManyToMany(() => Task, (t) => t.dependencies)
  dependents!: Task[]; // Tasks that depend on this task

  @Field(() => Date)
  @CreateDateColumn()
  createdAt!: Date; // Timestamp when the task was created

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt!: Date; // Timestamp when the task was last updated
}
