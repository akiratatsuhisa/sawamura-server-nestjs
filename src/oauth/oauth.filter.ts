import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { AppError } from 'src/common/errors';

@Catch(AppError.OauthError)
export class OauthExceptionsFilter extends BaseExceptionFilter {
  catch(_exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();

    response.redirect(`${process.env.OAUTH_CLIENT_URL}/oauth/error`);
  }
}
