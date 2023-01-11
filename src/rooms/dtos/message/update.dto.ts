import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateMessageDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
