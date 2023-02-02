import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteMemberDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
