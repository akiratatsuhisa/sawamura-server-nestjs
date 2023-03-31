import { IsDateString, IsEmpty, IsNotEmpty } from 'class-validator';

export class SearchChartMessagesDto {
  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @IsDateString()
  @IsNotEmpty()
  toDate: string;
}

export class SearchChartUserRolesDto {
  @IsEmpty()
  data: string;
}
