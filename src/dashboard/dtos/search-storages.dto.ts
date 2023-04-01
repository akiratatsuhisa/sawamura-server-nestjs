import { IsEmpty } from 'class-validator';

export class SearchStorageDropbox {
  @IsEmpty()
  data: string;
}

export class SearchCountUsers {
  @IsEmpty()
  data: string;
}
