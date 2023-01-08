import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export abstract class PaginationOffset {
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @Max(100)
  @Min(10)
  @IsOptional()
  @Type(() => Number)
  take?: number;
}

export abstract class PaginationCursor<C extends string | number = string> {
  abstract cursor?: C;

  @Max(100)
  @Min(10)
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  take?: number;
}
