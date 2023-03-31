import { IsEmpty } from 'class-validator';

export class SearchStorageDropbox {
  @IsEmpty()
  data: string;
}
