import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';
import { WsAuthService } from '../ws-auth.service';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private wsAuthService: WsAuthService,
  ) {}

  canActivate(context: ExecutionContext) {
    const client: SocketWithAuth = context.switchToWs().getClient();

    if (client.isExpires()) {
      this.wsAuthService.leave(client);
      this.wsAuthService.clearAuth(client);
    }

    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isPublic) {
      return true;
    }

    return client.principal.isAuthenticated;
  }
}
