import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { AUTH_REGEX } from '../constants';

export class RegisterDto {
  @Matches(AUTH_REGEX.USERNAME)
  @MaxLength(255)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  username: string;

  @Matches(AUTH_REGEX.DISPLAY_NAME)
  @MaxLength(128)
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsEmail()
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @Matches(AUTH_REGEX.PASSWORD)
  @MaxLength(64)
  @MinLength(8)
  @IsString()
  @IsNotEmpty()
  password: string;
}
