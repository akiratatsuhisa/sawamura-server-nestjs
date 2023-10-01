import { WhinnyType } from '@prisma/client';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import _ from 'lodash';

export class CreateWhinnyDto {
  @IsIn(_.values(WhinnyType))
  @IsString()
  @IsNotEmpty()
  type: WhinnyType;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @ValidateIf((obj) => obj.type !== WhinnyType.Owner)
  sourceId?: string;

  @MaxLength(360)
  @IsString()
  @IsNotEmpty()
  @ValidateIf((obj) => obj.type !== WhinnyType.Repost)
  content?: string;

  @IsDateString()
  @IsOptional()
  @ValidateIf((obj) => obj.type === WhinnyType.Owner)
  publishDate?: string;
}
