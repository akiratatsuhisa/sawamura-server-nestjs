export const messages = {
  UnknownError: 'Unknown error',
  NotFoundError: 'Not found',
  NotFoundEntityError: (entity: string, id: any) =>
    `Not found ${entity}(${id})`,
  UnauthenticatedError: 'Unauthenticated',
  UnauthorizedError: 'Unauthorized',
  AccessDeninedError: 'Access Denined',
  BadQueryError: 'Bad Request Query',
  BadDtoError: 'Bad Request Data',
  ArgumentError: 'Bad Argument',
  PrismaError: 'Database Storage Error',
};
