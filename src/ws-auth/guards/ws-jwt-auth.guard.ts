import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppError } from 'src/common/errors';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.types';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const client: SocketWithAuth = context.switchToWs().getClient();
    if (client.isExpires()) {
      client.disconnect();
    }

    if (client.principal.isAuthenticated) {
      return true;
    }

    throw new AppError.Unauthenticated();
  }
}
