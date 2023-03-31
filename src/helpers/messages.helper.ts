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
  InvalidDateFromTo: 'The field from date must less than or equal to date',
  // Storage Messages
  FilesUploadFailed:
    'file(s) upload has failed. Please review the uploaded file(s) or try again',
  FilesDownloadFailed:
    'file(s) download has failed. Please review the downloaded file(s) or try again',
  FilesDeleteFailed: 'file(s) delete has failed. Please try again',
  FilesRequired: 'file(s) is required',
  OverMaxFileSize: (name: string, size: string | number) =>
    `file(${name}) size must be less than or equal ${size}`,
  InvalidFileMimeType: (name: string, mimeType: string) =>
    `file(${name}) mime type must be match ${mimeType}`,
  InvalidFileDimensions: (
    name: string,
    dimensions: {
      equal?: boolean;
      width: number;
      height: number;
    },
  ) =>
    `file(${name}) dimensions must be match (${
      dimensions?.equal
        ? `width equal ${dimensions.width}, height equal ${dimensions.height}`
        : `width less than or equal ${dimensions.width}, height  less than or equal ${dimensions.height}`
    })`,
  //Auth Messages
  InvalidRefreshToken:
    'The refresh token provided is invalid or has expired. Please log in again to generate a new refresh token',
  InvalidVerificationToken:
    'This verification token is invalid or has already been used. Please request a new one if you need to verify your account again',
  // Room Messages
  NotRoomMember: (username: string) => `user(${username}) not in room`,
  InvalidPrivateRoom: 'invalid private room declare',
  InvalidGroupRoom: 'invalid group room declare',
};
