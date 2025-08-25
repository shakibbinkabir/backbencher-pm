import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateProjectDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
