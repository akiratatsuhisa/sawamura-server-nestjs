import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { AppError } from 'src/helpers/errors.helper';
import { catchPrismaException } from 'src/prisma/catch-prisma-exception.factory';

@Catch()
export class GlobalExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();

    exception = catchPrismaException(exception);

    if (exception instanceof AppError.BasicError) {
      response.status(exception.getStatus()).json(exception.getResponseBody());
      return;
    }

    super.catch(exception, host);
  }
}
