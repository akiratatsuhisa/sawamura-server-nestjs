import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterDto {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  username: string;

  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  password: string;
}
