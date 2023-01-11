import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationCursor } from 'src/common/dtos';

export class SearchMessagesDto extends PaginationCursor {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsString()
  @IsOptional()
  cursor?: string;
}
