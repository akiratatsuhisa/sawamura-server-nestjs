import { ConfigService } from '@nestjs/config';
import { WebSocketGateway } from '@nestjs/websockets';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';

import { NAME } from './constants';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({ namespace: NAME })
export class NotificationsGateway extends WsAuthGateway {
  constructor(
    configService: ConfigService,
    wsAuthService: WsAuthService,
    private notificationsService: NotificationsService,
  ) {
    super(configService, wsAuthService);
  }
}
