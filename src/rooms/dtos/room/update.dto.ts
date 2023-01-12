import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateRoomDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  name: string;
}
