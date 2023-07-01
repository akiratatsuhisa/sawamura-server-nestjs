import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateEmailDto {
  @MaxLength(255)
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
}
