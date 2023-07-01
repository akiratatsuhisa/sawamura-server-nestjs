import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePasswordDto {
  @MaxLength(64)
  @IsString()
  @IsOptional()
  currentPassword: string;

  @MaxLength(64)
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
