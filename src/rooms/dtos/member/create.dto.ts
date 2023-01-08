import { RoomMemberRole } from '@prisma/client';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';
import * as _ from 'lodash';

export class CreateMemberDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsIn(_.values(RoomMemberRole))
  @IsNotEmpty()
  role: string;
}
