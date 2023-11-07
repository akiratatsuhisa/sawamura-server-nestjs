import { messages } from '@akiratatsuhisa/sawamura-utils';
import { HttpStatus } from '@nestjs/common';
import { EVENTS } from 'src/ws-auth/constants';

export namespace AppError {
  export abstract class BasicError {
    protected _isDetail = true;
    protected _event = EVENTS.EXCEPTION;

    // localization message params
    private params?: Record<string, unknown> | Array<unknown>;
    // request data
    private data?: Record<string, unknown> | Array<unknown>;
    // error;
    private errors?: Record<string, unknown> | Array<unknown>;

    constructor(
      public readonly statusCode: number,
      public message: string = messages.error.unknown,
      public title: string = messages.error.unknown,
    ) {}

    setShowDetail(active: boolean) {
      this._isDetail = active;
      return this;
    }

    setParams(params: Record<string, unknown> | Array<unknown>) {
      this.params = params;
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
      body.params = this.params;
      body.errors = this.errors;
      body.data = this._isDetail ? this.data : undefined;

      return body;
    }
  }

  export class Unauthenticated extends BasicError {
    constructor(
      message: string = messages.error.unauthenticated,
      title: string = messages.error.unauthenticated,
    ) {
      super(HttpStatus.UNAUTHORIZED, message, title);
    }
  }

  export class Unauthorized extends BasicError {
    constructor(
      message: string = messages.error.unauthorized,
      title: string = messages.error.unauthorized,
    ) {
      super(HttpStatus.FORBIDDEN, message, title);
    }
  }

  export class AccessDenied extends BasicError {
    constructor(
      message: string = messages.error.accessDenined,
      title: string = messages.error.accessDenined,
    ) {
      super(HttpStatus.FORBIDDEN, message, title);
    }
  }

  export class NotFound extends BasicError {
    constructor(
      message: string = messages.error.notFound,
      title: string = messages.error.notFound,
    ) {
      super(HttpStatus.NOT_FOUND, message, title);
    }
  }

  export class BadQuery extends BasicError {
    constructor(
      message: string = messages.error.badQuery,
      title: string = messages.error.badQuery,
    ) {
      super(HttpStatus.BAD_REQUEST, message, title);
    }
  }

  export class BadDto extends BasicError {
    constructor(
      message: string = messages.error.badDto,
      title: string = messages.error.badDto,
    ) {
      super(HttpStatus.BAD_REQUEST, message, title);
    }
  }

  export class Argument extends BasicError {
    constructor(
      message: string = messages.error.argument,
      title: string = messages.error.argument,
    ) {
      super(HttpStatus.BAD_REQUEST, message, title);
    }
  }

  export class Prisma extends BasicError {
    constructor(
      message: string = messages.error.prisma,
      title: string = messages.error.prisma,
    ) {
      super(HttpStatus.INTERNAL_SERVER_ERROR, message, title);
    }
  }

  export const Messages = {
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
  };
}
