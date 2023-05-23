import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AppError } from 'src/common/errors';

import { IdentityPrincipal, IdentityUser, IS_PUBLIC_KEY } from '../decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  handleRequest(
    err: unknown,
    user: IdentityUser,
    _info: unknown,
    context: ExecutionContext,
  ) {
    const req = context.switchToHttp().getRequest();
    req.principal = new IdentityPrincipal((user ||= undefined));

    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isPublic && !user) {
      return null;
    }

    if (err || !user) {
      throw new AppError.Unauthenticated();
    }

    return user as any;
  }
}
