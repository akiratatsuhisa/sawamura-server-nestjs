import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class SortRoleDto {
  @IsUUID()
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  sort: number;
}
