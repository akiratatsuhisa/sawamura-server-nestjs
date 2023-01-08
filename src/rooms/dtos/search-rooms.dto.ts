import { PaginationCursor } from 'src/common/dtos';

export class SearchRoomDto {
  id: string;
}

export class SearchRoomsDto extends PaginationCursor {
  roomId?: string;

  cursor?: string;
}
