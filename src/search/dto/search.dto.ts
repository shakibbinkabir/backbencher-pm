import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Search query string' })
  @IsString()
  q!: string;

  @ApiPropertyOptional({ description: 'Type of entity to search', enum: ['project', 'task'] })
  @IsOptional()
  @IsIn(['project', 'task'])
  type?: 'project' | 'task';

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by priority' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Number of results to return', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Number of results to skip', minimum: 0, default: 0 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class AutocompleteQueryDto {
  @ApiPropertyOptional({ description: 'Autocomplete query string' })
  @IsString()
  q!: string;

  @ApiPropertyOptional({ description: 'Number of suggestions to return', minimum: 1, maximum: 10, default: 5 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 5;
}
