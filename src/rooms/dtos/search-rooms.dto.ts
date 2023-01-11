import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationCursor } from 'src/common/dtos';

export class SearchRoomDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class SearchRoomsDto extends PaginationCursor {
  @IsUUID()
  @IsString()
  @IsOptional()
  cursor?: string;
}
