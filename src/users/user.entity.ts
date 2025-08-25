import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Role } from '../common/enums/role.enum';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  // Don't expose password in GraphQL
  @Column({ type: 'varchar', length: 120 })
  password!: string;

  @Field(() => [String])
  @Column({ type: 'simple-array', default: 'MEMBER' })
  roles!: Role[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt!: Date;
}
