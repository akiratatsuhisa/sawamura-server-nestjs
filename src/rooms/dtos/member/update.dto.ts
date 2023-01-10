import { RoomMemberRole } from '@prisma/client';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateMemberDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @MaxLength(255)
  @IsString()
  @IsOptional()
  nickName?: string;

  @IsIn([RoomMemberRole.Admin, RoomMemberRole.Member, RoomMemberRole.Moderator])
  @ValidateIf((object, value) => value !== undefined)
  role?: RoomMemberRole;
}
