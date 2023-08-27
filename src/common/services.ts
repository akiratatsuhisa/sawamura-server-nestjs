import _ from 'lodash';

import { PaginationCursor, PaginationOffset } from './dtos';

export namespace PaginationService {
  export function makePaginationOffset<Q extends PaginationOffset>(
    query: Q,
  ): {
    take?: number;
    skip?: number;
  } {
    return {
      take: _.isNumber(query.take) ? query.take : undefined,
      skip: _.isNumber(query.skip) ? query.skip : undefined,
    };
  }

  export function makePaginationCursor<
    Q extends PaginationCursor<string | number>,
  >(
    query: Q,
  ): {
    take?: number;
    skip?: number;
    cursor?: { id: Q['cursor'] };
  } {
    return {
      take: _.isNumber(query.take) ? query.take : undefined,
      skip: !_.isNil(query.cursor) && query.cursor !== '' ? 1 : undefined,
      cursor:
        !_.isNil(query.cursor) && query.cursor !== ''
          ? { id: query.cursor }
          : undefined,
    };
  }
}
