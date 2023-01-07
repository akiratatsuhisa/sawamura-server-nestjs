import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppError } from 'src/helpers/errors.helper';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';

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
