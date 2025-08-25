import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min, ArrayUnique } from 'class-validator';
import { TaskPriority, TaskStatus } from '../task.enums';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateTaskDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => TaskStatus, { nullable: true })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Field(() => TaskPriority, { nullable: true })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  estimate?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  timeSpent?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  dependencyIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];

  // Required skills for scheduling
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  requiredSkills?: string[];
}
