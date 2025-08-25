import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';
import { Task } from './task.entity';

@ObjectType()
@Entity('projects')
export class Project {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Index()
  @Column({ type: 'varchar', length: 140 })
  name!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt!: Date;

  @Field(() => [Task])
  @OneToMany(() => Task, (task) => task.project)
  tasks!: Task[];
}
