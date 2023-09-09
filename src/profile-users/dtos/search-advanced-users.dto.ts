import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchAdvancedUsersDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  search?: string;
}
