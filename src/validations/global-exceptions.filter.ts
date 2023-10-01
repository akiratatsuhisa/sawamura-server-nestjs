import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { AppError } from 'src/common/errors';
import { catchPrismaException } from 'src/prisma/catch-prisma-exception.factory';

@Catch()
export class GlobalExceptionsFilter extends BaseExceptionFilter {
  private logger = new Logger(GlobalExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();

    exception = catchPrismaException(exception);

    if (exception instanceof AppError.BasicError) {
      this.logger.error(exception.message);
      response.status(exception.getStatus()).json(exception.getResponseBody());
      return;
    }

    super.catch(exception, host);
  }
}
