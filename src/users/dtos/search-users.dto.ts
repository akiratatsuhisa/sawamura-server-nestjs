import { IsOptional, IsString } from 'class-validator';

export class SearchUsersDto {
  @IsString()
  @IsOptional()
  search?: string;
}
