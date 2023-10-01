import { WhinnyReactionKind } from '@prisma/client';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import _ from 'lodash';

export class UpdateWhinnyReactionDto {
  @IsString()
  @IsNotEmpty()
  urlId: string;

  @IsIn(_.values(WhinnyReactionKind))
  @IsString()
  @IsNotEmpty()
  kind: WhinnyReactionKind;
}
