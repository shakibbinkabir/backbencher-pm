import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Role } from '../common/enums/role.enum';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => String)
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 120 })
  password!: string;

  @Field(() => [String])
  @Column({ type: 'simple-array', default: 'MEMBER' })
  roles!: Role[];

  // Skills for scheduling (comma-separated). Optional.
  @Field(() => [String], { nullable: true })
  @Column({ type: 'simple-array', nullable: true })
  skills?: string[] | null;

  // Weekly capacity in hours; defaults to 40.
  @Field(() => Number)
  @Column({ type: 'int', default: 40 })
  weeklyCapacityHours!: number;

  // Virtual workload tracked by scheduler (persisted to show historical trend if desired).
  @Field(() => Number)
  @Column({ type: 'int', default: 0 })
  assignedHours!: number;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt!: Date;
}
