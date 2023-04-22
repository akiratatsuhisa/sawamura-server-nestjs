import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  name: string;
}
