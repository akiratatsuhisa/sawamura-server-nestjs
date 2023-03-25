import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  token: string;

  @MaxLength(255)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  password: string;
}
