import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { TaskPriority, TaskStatus } from '../task.enums';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateTaskDto {
  @Field(() => String)
  @IsUUID()
  projectId!: string;
  // ID of the project to which the task belongs
  @Field(() => String)
  @IsString()
  title!: string;
  // Title of the task
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
  // Description of the task
  @Field(() => TaskStatus, { nullable: true })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
  // Current status of the task
  @Field(() => TaskPriority, { nullable: true })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
  // Priority level of the task
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
  // Due date for the task
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  estimate?: number;
  // Estimated hours to complete the task
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  timeSpent?: number;
  // Actual time spent on the task
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
  // ID of the user assigned to the task
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  dependencyIds?: string[];
  // IDs of tasks that this task depends on
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];
  // Tags associated with the task
  // Required skills for scheduling
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  requiredSkills?: string[];
}
