import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { FindOneParams, PaginationExcludeIds } from 'src/common/dtos';

export class SearchNotificationDto extends FindOneParams.Uuid {}

export class SearchNotificationsDto extends PaginationExcludeIds {
  @IsUUID('all', { each: true })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  excludeIds?: Array<string>;
}
