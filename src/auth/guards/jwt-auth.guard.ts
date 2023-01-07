import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { AppError } from 'src/helpers/errors.helper';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IdentityUser, IdentityPrincipal } from '../decorators/users.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    const req = context.switchToHttp().getRequest();

    req.isPublic = isPublic;

    return super.canActivate(context);
  }

  handleRequest(
    err: unknown,
    user: IdentityUser,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ) {
    const req = context.switchToHttp().getRequest();

    req.principal = new IdentityPrincipal(user || undefined);

    const isPublic: boolean = req.isPublic;

    if (isPublic && !user) {
      return null;
    }

    if (err || !user) {
      throw new AppError.Unauthenticated();
    }

    return user as any;
  }
}
