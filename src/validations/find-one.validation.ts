import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export namespace FindOneParams {
  export class Number {
    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    id: number;
  }

  export class Uuid {
    @IsUUID()
    @IsNotEmpty()
    @Type(() => String)
    id: string;
  }
}
