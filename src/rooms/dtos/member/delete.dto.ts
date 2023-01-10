import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteMemberDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  memberId: string;
}
