import { RoomMemberRole } from '@prisma/client';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateMemberDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsIn([RoomMemberRole.Member, RoomMemberRole.Moderator])
  @IsString()
  @ValidateIf((object, value) => value !== undefined)
  role?: RoomMemberRole;
}
