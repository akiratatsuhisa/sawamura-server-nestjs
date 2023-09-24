import { Regex } from '@akiratatsuhisa/sawamura-utils';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePasswordDto {
  @MaxLength(64)
  @IsString()
  @IsOptional()
  currentPassword: string;

  @Matches(Regex.Validate.PASSWORD)
  @MaxLength(64)
  @MinLength(8)
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
