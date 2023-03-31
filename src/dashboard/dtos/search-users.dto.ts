import { IsEmpty } from 'class-validator';

export class SearchCountUsers {
  @IsEmpty()
  data: string;
}
