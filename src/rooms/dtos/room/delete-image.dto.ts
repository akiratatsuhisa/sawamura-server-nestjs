import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteRoomImageDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  type: 'photo' | 'cover';
}
