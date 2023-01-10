import { RoomMemberRole } from '@prisma/client';
import { IsIn, IsNotEmpty, IsUUID, ValidateIf } from 'class-validator';

export class CreateMemberDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsIn([RoomMemberRole.Member, RoomMemberRole.Moderator])
  @ValidateIf((object, value) => value !== undefined)
  role?: RoomMemberRole;
}
