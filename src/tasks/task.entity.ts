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
  id!: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Field(() => TaskStatus)
  @Column({ type: 'varchar', length: 20, default: TaskStatus.TODO })
  status!: TaskStatus;

  @Field(() => TaskPriority)
  @Column({ type: 'varchar', length: 20, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @Field(() => Date, { nullable: true })
  @Column('datetime', { nullable: true })
  dueDate?: Date | null;

  @Field(() => Number, { nullable: true, description: 'Estimated hours' })
  @Column({ type: 'int', default: 0 })
  estimate!: number;

  @Field(() => Number, { nullable: true, description: 'Time spent in hours' })
  @Column({ type: 'int', default: 0 })
  timeSpent!: number;

  // Stored as comma-separated in DB; expose as array in GraphQL/REST
  @Field(() => [String])
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[] | null;

  @Field(() => Project)
  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Field(() => String)
  @Column({ type: 'uuid' })
  projectId!: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'assigneeId' })
  assignee?: User | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  assigneeId?: string | null;

  @Field(() => [Task], { description: 'Tasks that this task depends on' })
  @ManyToMany(() => Task, (t) => t.dependents, { cascade: false })
  @JoinTable({
    name: 'task_dependencies',
    joinColumn: { name: 'taskId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'dependsOnId', referencedColumnName: 'id' }
  })
  dependencies!: Task[];

  @Field(() => [Task], { description: 'Tasks that depend on this task' })
  @ManyToMany(() => Task, (t) => t.dependencies)
  dependents!: Task[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt!: Date;
}
