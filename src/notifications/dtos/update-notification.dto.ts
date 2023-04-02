import { NotificationStatus } from '@prisma/client';
import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateNotificationDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsIn([
    NotificationStatus.Delivered,
    NotificationStatus.Viewed,
    NotificationStatus.Read,
    NotificationStatus.Archived,
  ])
  @IsString()
  @IsNotEmpty()
  status: NotificationStatus;
}
