import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Format: field:direction e.g., "createdAt:desc" or "priority:asc"
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+:(asc|desc)$/)
  sort?: string = 'createdAt:desc';
}
