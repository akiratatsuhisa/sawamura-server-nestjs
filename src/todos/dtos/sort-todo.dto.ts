import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class SortTodoDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  id: number;

  @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  sort: number;
}
