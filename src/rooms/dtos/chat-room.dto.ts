import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ChatRoomDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
