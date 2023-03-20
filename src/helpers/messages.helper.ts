export const messages = {
  // Common Messages
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
  // Storage Messages
  FilesUploadFailed:
    'file(s) upload has failed. Please review the uploaded file(s) or try again',
  FilesDownloadFailed:
    'file(s) download has failed. Please review the downloaded file(s) or try again',
  FilesDeleteFailed: 'file(s) delete has failed. Please try again',
  // Room Messages
  NotRoomMember: (username: string) => `user(${username}) not in room`,
  InvalidPrivateRoom: 'invalid private room declare',
  InvalidGroupRoom: 'invalid group room declare',
};
