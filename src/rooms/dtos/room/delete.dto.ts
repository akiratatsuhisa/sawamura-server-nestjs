import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteRoomDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
