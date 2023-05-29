import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/auth/decorators';
import { AppError } from 'src/common/errors';

import { SocketWithAuth } from '../ws-auth.types';

@Injectable()
export class WsRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user }: SocketWithAuth = context.switchToWs().getClient();

    if (requiredRoles.some((role) => user.roles?.includes(role))) {
      return true;
    }

    throw new AppError.Unauthorized();
  }
}
