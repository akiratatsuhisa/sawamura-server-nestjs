import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteWhinnyDto {
  @IsString()
  @IsNotEmpty()
  urlId: string;
}
