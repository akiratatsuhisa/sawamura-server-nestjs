import { Regex } from '@akiratatsuhisa/sawamura-utils';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @Matches(Regex.Validate.USERNAME)
  @MaxLength(16)
  @MinLength(4)
  @IsString()
  @IsNotEmpty()
  username: string;

  @MaxLength(64)
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsEmail()
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @Matches(Regex.Validate.PASSWORD)
  @MaxLength(64)
  @MinLength(8)
  @IsString()
  @IsNotEmpty()
  password: string;
}
