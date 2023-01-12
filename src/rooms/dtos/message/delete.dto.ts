import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteMessageDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;
}
