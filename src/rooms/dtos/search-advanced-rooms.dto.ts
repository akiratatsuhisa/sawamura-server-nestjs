import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchAdvancedRoomsDto {
  @IsString()
  @IsNotEmpty()
  search: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  privateRoomId?: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  groupRoomId?: string;
}
