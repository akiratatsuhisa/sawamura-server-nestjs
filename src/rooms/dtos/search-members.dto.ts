import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SearchMembersDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
