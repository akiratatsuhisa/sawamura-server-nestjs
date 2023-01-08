import { RoomMemberRole } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class CreateRoomMemberDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsIn([RoomMemberRole.Admin, RoomMemberRole.Moderator, RoomMemberRole.Member])
  @IsNotEmpty()
  role: RoomMemberRole;
}

export class CreateRoomDto {
  @MaxLength(255)
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  isGroup: boolean;

  @ValidateNested({ each: true })
  @ArrayUnique<CreateRoomMemberDto>((o) => o.memberId)
  @ArrayMaxSize(255)
  @ArrayNotEmpty()
  @IsArray()
  @Type(() => CreateRoomMemberDto)
  members: Array<CreateRoomMemberDto>;
}
