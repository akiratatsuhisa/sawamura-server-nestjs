import { IsNotEmpty, IsString } from 'class-validator';

export class SearchImageDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  type: 'photo' | 'cover';
}
