import { IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class UpdateRoomDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @MaxLength(255)
  @IsNotEmpty()
  name: string;
}
