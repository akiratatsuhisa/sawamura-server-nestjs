import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UnlinkProviderDto {
  @IsIn(['google', 'github'])
  @IsString()
  @IsNotEmpty()
  provider: string;
}
