import { Provider } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common/pipes';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { SecurityGuard } from './auth/guards/security.guard';
import { DtoParseInterceptor } from './validations/dto-parse.interceptor';
import { GlobalExceptionsFilter } from './validations/global-exceptions.filter';
import { exceptionFactory } from './validations/validation.factory';

export const appProviders: Array<Provider> = [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: SecurityGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  {
    provide: APP_PIPE,
    useFactory: () =>
      new ValidationPipe({
        transform: true,
        exceptionFactory,
      }),
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: DtoParseInterceptor,
  },
  {
    provide: APP_FILTER,
    useClass: GlobalExceptionsFilter,
  },
];
