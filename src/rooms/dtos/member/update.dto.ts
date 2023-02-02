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
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @MaxLength(255)
  @IsString()
  @IsOptional()
  nickName?: string;

  @IsIn([RoomMemberRole.Admin, RoomMemberRole.Member, RoomMemberRole.Moderator])
  @IsString()
  @ValidateIf((object, value) => value !== undefined)
  role?: RoomMemberRole;
}
