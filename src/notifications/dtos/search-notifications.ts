import { IsOptional, IsString, IsUUID } from 'class-validator';
import { FindOneParams, PaginationCursor } from 'src/common/dtos';

export class SearchNotificationDto extends FindOneParams.Uuid {}

export class SearchNotificationsDto extends PaginationCursor {
  @IsUUID()
  @IsString()
  @IsOptional()
  cursor?: string;
}
