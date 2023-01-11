import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @Matches(/^[a-zA-Z]([a-zA-Z0-9])*$/)
  @MaxLength(255)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  username: string;

  @MaxLength(255)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  password: string;
}
