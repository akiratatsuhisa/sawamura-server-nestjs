import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationExcludeIds } from 'src/common/dtos';

export class SearchRoomDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class SearchRoomsDto extends PaginationExcludeIds {
  @IsUUID('all', { each: true })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  excludeIds?: Array<string>;
}

export class SearchImageDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  type: 'photo' | 'cover';
}

export class TypingRoomDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  userId: string;
}
