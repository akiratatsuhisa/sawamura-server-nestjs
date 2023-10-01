import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationCursor } from 'src/common/dtos';

export class SearchWhinnyReactionsDto extends PaginationCursor {
  @IsString()
  @IsNotEmpty()
  urlId: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cursor?: string;
}
