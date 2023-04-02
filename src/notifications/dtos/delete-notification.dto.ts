import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteNotificationDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;
}
