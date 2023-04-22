import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @IsUUID()
  @IsNotEmpty()
  @IsString()
  id: string;

  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  name: string;
}
