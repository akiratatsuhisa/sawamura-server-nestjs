import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTodoDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  id: number;

  @MaxLength(64)
  @IsString()
  @IsNotEmpty()
  title: string;

  @MaxLength(450)
  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}
