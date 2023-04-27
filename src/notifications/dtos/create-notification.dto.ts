import {
  NotificationEntityName,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import _ from 'lodash';

export class CreateNotificationDto {
  @IsIn(_.values(NotificationEntityName))
  @IsString()
  @IsNotEmpty()
  entity?: NotificationEntityName;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  referenceId?: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  params: Prisma.JsonNullValueInput | Prisma.InputJsonValue;

  @IsIn([NotificationStatus.Queued, NotificationStatus.Sent])
  @IsString()
  @IsNotEmpty()
  status: NotificationStatus;
}
