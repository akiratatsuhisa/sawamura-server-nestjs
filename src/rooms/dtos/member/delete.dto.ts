import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteMemberDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  memberId: string;
}
