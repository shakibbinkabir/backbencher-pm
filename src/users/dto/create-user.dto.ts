import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // roles are set by seed/admin only; ignored on public signup
  @IsOptional()
  roles?: string[];
}
