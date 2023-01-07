import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @MaxLength(255)
  @IsString()
  @IsOptional()
  value?: string;
}
