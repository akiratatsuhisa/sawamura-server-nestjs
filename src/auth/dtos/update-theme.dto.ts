import { IsNumber, Max, Min, ValidateIf } from 'class-validator';

export class UpdateThemeDto {
  @Max(0xffffffff)
  @Min(0x00000000)
  @IsNumber()
  @ValidateIf((object, value) => value !== null)
  source: number;
}
