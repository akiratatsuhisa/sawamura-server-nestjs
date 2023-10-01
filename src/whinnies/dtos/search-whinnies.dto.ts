import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import _ from 'lodash';
import { PaginationCursor } from 'src/common/dtos';

export class SearchWhinniesDto extends PaginationCursor {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  sourceId?: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((obj) => _.isNil(obj.sourceId))
  username?: string;
}

export class SearchWhinnyDto {
  @IsString()
  @IsNotEmpty()
  urlId: string;
}
