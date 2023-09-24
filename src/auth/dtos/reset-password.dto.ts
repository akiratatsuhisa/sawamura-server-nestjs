import { Regex } from '@akiratatsuhisa/sawamura-utils';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  token: string;

  @Matches(Regex.Validate.PASSWORD)
  @MaxLength(64)
  @MinLength(8)
  @IsString()
  @IsNotEmpty()
  password: string;
}
