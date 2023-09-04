import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchAdvancedRoomsDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  search?: string;
}
