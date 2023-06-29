import { HttpStatus } from '@nestjs/common';
import { EVENTS } from 'src/ws-auth/constants';

export namespace AppError {
  export abstract class BasicError {
    protected _isDetail = true;
    protected _event = EVENTS.EXCEPTION;

    data?: Record<string, unknown> | Array<unknown>;
    errors?: Record<string, unknown> | Array<unknown>;

    constructor(
      public readonly statusCode: number,
      public message: string = AppError.Messages.UnknownError,
      public title: string = AppError.Messages.UnknownError,
    ) {}

    setShowDetail(active: boolean) {
      this._isDetail = active;
      return this;
    }

    setData(data: Record<string, unknown> | Array<unknown>) {
      this.data = data;
      return this;
    }

    setErrors(errors: Record<string, unknown> | Array<unknown>) {
      this.errors = errors;
      return this;
    }

    setEvent(name?: string) {
      this._event = name ? `exception:${name}` : this._event;
      return this;
    }

    getEvent() {
      return this._event;
    }

    getStatus() {
      return this.statusCode;
    }

    getResponseBody(): Record<string, unknown> {
      const body: Record<string, unknown> = {};
      body.statusCode = this._isDetail ? this.statusCode : undefined;
      body.title = this._isDetail ? this.title : undefined;
      body.message = this.message;
      body.data = this._isDetail ? this.data : undefined;
      body.errors = this.errors;

      return body;
    }
  }

  export class Unauthenticated extends BasicError {
    constructor(
      message: string = AppError.Messages.UnauthenticatedError,
      title: string = AppError.Messages.UnauthenticatedError,
    ) {
      super(HttpStatus.UNAUTHORIZED, message, title);
    }
  }

  export class Unauthorized extends BasicError {
    constructor(
      message: string = AppError.Messages.UnauthorizedError,
      title: string = AppError.Messages.UnauthorizedError,
    ) {
      super(HttpStatus.FORBIDDEN, message, title);
    }
  }

  export class AccessDenied extends BasicError {
    constructor(
      message: string = AppError.Messages.AccessDeninedError,
      title: string = AppError.Messages.UnauthorizedError,
    ) {
      super(HttpStatus.FORBIDDEN, message, title);
    }
  }

  export class OauthError extends BasicError {
    constructor(
      message: string = AppError.Messages.UnauthenticatedError,
      title: string = AppError.Messages.UnauthenticatedError,
    ) {
      super(HttpStatus.UNAUTHORIZED, message, title);
    }
  }

  export class NotFound extends BasicError {
    constructor(
      message: string = AppError.Messages.NotFoundError,
      title: string = AppError.Messages.NotFoundError,
    ) {
      super(HttpStatus.NOT_FOUND, message, title);
    }
  }

  export class BadQuery extends BasicError {
    constructor(
      message: string = AppError.Messages.BadQueryError,
      title: string = AppError.Messages.BadQueryError,
    ) {
      super(HttpStatus.BAD_REQUEST, message, title);
    }
  }

  export class BadDto extends BasicError {
    constructor(
      message: string = AppError.Messages.BadDtoError,
      title: string = AppError.Messages.BadDtoError,
    ) {
      super(HttpStatus.BAD_REQUEST, message, title);
    }
  }

  export class Argument extends BasicError {
    constructor(
      message: string = AppError.Messages.ArgumentError,
      title: string = AppError.Messages.ArgumentError,
    ) {
      super(HttpStatus.BAD_REQUEST, message, title);
    }
  }

  export class Prisma extends BasicError {
    constructor(
      message: string = AppError.Messages.PrismaError,
      title: string = AppError.Messages.PrismaError,
    ) {
      super(HttpStatus.INTERNAL_SERVER_ERROR, message, title);
    }
  }

  export const Messages = {
    // Common Messages
    UnknownError: 'Unknown error',
    NotFoundError: 'Not found',
    NotFoundEntityError: (entity: string, id: any) =>
      `Not found ${entity}(${id})`,
    UnauthenticatedError: 'Unauthenticated',
    UnauthorizedError: 'Unauthorized',
    AccessDeninedError: 'Access Denined',
    DefaultDataError: 'Default Data',
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
    InvalidForgotPassword:
      "Not found username or account's email isn't verified.",
    // Room Messages
    NotRoomMember: (username: string) => `user(${username}) not in room`,
    InvalidPrivateRoom: 'invalid private room declare',
    InvalidGroupRoom: 'invalid group room declare',
  };
}
