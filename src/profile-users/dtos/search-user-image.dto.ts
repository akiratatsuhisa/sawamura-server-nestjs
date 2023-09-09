import { IsNotEmpty, IsString } from 'class-validator';

export class SearchUserImageDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  type: 'photo' | 'cover';
}
