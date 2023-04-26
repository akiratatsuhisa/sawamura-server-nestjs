import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  value?: string;
}
