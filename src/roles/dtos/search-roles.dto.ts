import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SearchRoleDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;
}
