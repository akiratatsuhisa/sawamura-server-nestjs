import { PaginationCursor, PaginationOffset } from './dtos';

export abstract class PaginationService {
  makePaginationOffset<Q extends PaginationOffset>(query: Q) {
    return {
      take: query.take,
      skip: query.skip,
    };
  }

  makePaginationCursor<Q extends PaginationCursor>(query: Q) {
    return {
      take: query.take,
      skip: query.cursor ? 1 : undefined,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    };
  }
}
