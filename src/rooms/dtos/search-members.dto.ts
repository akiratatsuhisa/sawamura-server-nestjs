import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SearchMemberDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  memberId: string;
}

export class SearchMembersDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
