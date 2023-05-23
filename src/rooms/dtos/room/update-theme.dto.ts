import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateRoomThemeDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @Max(0xffffffff)
  @Min(0x00000000)
  @IsNumber()
  @ValidateIf((object, value) => value !== null)
  source: number;
}
