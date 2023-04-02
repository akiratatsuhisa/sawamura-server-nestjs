import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.types';

import { NAME, SOCKET_NOTIFICATION_EVENTS } from './constants';
import {
  DeleteNotificationDto,
  SearchNotificationsDto,
  UpdateNotificationDto,
} from './dtos';
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

  @SubscribeMessage(SOCKET_NOTIFICATION_EVENTS.LIST_NOTIFICATION)
  async getNotifications(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchNotificationsDto,
  ) {
    this.notificationsService.getNotifications(dto, client.user);
  }

  @SubscribeMessage(SOCKET_NOTIFICATION_EVENTS.UPDATE_NOTIFICATION)
  async updateNotification(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: UpdateNotificationDto,
  ) {
    this.notificationsService.updateNotification(dto, client.user);
  }

  @SubscribeMessage(SOCKET_NOTIFICATION_EVENTS.DELETE_NOTIFICATION)
  async deleteNotification(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: DeleteNotificationDto,
  ) {
    this.notificationsService.deleteNotification(dto, client.user);
  }
}
