import { Provider } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { GlobalExceptionsFilter } from './validations/global-exceptions.filter';
import { ParamsAsBodyInterceptor } from './validations/params-as-body.interceptor';

export const appProviders: Array<Provider> = [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: ParamsAsBodyInterceptor,
  },
  {
    provide: APP_FILTER,
    useClass: GlobalExceptionsFilter,
  },
];
