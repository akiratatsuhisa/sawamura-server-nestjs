import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from 'src/common/errors';

import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators';

@Injectable()
export class SecurityGuard implements CanActivate {
  constructor(private reflector: Reflector, private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();

    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isPublic && !user) {
      return true;
    }

    if (await this.authService.verifySecurityStamp(user.securityStamp)) {
      return true;
    }

    throw new AppError.Unauthenticated();
  }
}
