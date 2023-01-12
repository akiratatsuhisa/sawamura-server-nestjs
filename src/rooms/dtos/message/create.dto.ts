import { RoomMessageType } from '@prisma/client';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import * as _ from 'lodash';

export class CreateMessageDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsIn(
    _(RoomMessageType)
      .values()
      .remove((v) => v !== RoomMessageType.None)
      .value(),
  )
  @IsString()
  @ValidateIf((object, value) => value !== undefined)
  type?: RoomMessageType;

  @IsString()
  @IsNotEmpty()
  content: string;
}
