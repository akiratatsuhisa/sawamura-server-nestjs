import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { AUTH_REGEX } from '../constants';

export class ResetPasswordDto {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  token: string;

  @Matches(AUTH_REGEX.PASSWORD)
  @MaxLength(64)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  password: string;
}
