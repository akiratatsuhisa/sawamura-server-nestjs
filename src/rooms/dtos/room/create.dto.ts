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
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class CreateRoomMemberDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsIn([RoomMemberRole.Admin, RoomMemberRole.Moderator, RoomMemberRole.Member])
  @IsString()
  @IsNotEmpty()
  role: RoomMemberRole;
}

export class CreateRoomDto {
  @MaxLength(255)
  @IsString()
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
