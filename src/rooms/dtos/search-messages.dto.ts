import { PaginationCursor } from 'src/common/dtos';

export class SearchMessagesDto extends PaginationCursor {
  roomId: string;

  cursor?: string;
}
