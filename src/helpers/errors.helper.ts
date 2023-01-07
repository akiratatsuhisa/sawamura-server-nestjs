import { messages } from './messages.helper';

import { HttpStatus } from '@nestjs/common';

export namespace AppError {
  export abstract class BasicError {
    protected _isDetail = true;

    data?: Record<string, unknown> | Array<unknown>;
    errors?: Record<string, unknown> | Array<unknown>;

    constructor(
      public statusCode: number,
      public message: string = messages.UnknownError,
      public title: string = messages.UnknownError,
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
      message: string = messages.UnauthenticatedError,
      title: string = messages.UnauthenticatedError,
    ) {
      super(HttpStatus.UNAUTHORIZED, message, title);
    }
  }

  export class Unauthorized extends BasicError {
    constructor(
      message: string = messages.UnauthorizedError,
      title: string = messages.UnauthorizedError,
    ) {
      super(HttpStatus.FORBIDDEN, message, title);
    }
  }

  export class NotFound extends BasicError {
    constructor(
      message: string = messages.NotFoundError,
      title: string = messages.NotFoundError,
    ) {
      super(HttpStatus.NOT_FOUND, message, title);
    }
  }

  export class BadQuery extends BasicError {
    constructor(
      message: string = messages.BadQueryError,
      title: string = messages.BadQueryError,
    ) {
      super(HttpStatus.BAD_REQUEST, message, title);
    }
  }

  export class BadDto extends BasicError {
    constructor(
      message: string = messages.BadDtoError,
      title: string = messages.BadDtoError,
    ) {
      super(HttpStatus.BAD_REQUEST, message, title);
    }
  }

  export class Argument extends BasicError {
    constructor(
      message: string = messages.ArgumentError,
      title: string = messages.ArgumentError,
    ) {
      super(HttpStatus.BAD_REQUEST, message, title);
    }
  }

  export class Prisma extends BasicError {
    constructor(
      message: string = messages.PrismaError,
      title: string = messages.PrismaError,
    ) {
      super(HttpStatus.INTERNAL_SERVER_ERROR, message, title);
    }
  }
}
