import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchUsersDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  search?: string;
}
