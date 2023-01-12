import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteMemberDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
