import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { AUTH_REGEX } from '../constants';

export class UpdatePasswordDto {
  @MaxLength(64)
  @IsString()
  @IsOptional()
  currentPassword: string;

  @Matches(AUTH_REGEX.PASSWORD)
  @MaxLength(64)
  @MinLength(8)
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
