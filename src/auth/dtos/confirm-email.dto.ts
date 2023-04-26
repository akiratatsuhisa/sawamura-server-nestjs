import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ConfirmEmailDto {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  token: string;
}
