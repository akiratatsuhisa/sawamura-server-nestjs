import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @Matches(/^[a-zA-Z]([a-zA-Z0-9])*$/)
  @MaxLength(255)
  @MinLength(3)
  @IsString()
  username: string;

  @MaxLength(255)
  @MinLength(3)
  @IsString()
  password: string;
}
