import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Roles } from 'src/auth/decorators';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.types';

import { SOCKET_DASHBOARD_EVENTS } from './constants';
import { DashboardService } from './dashboard.service';
import {
  SearchChartMessagesDto,
  SearchChartMessagesRoomsDto,
  SearchChartUserRolesDto,
  SearchCountUsers,
  SearchStorageDropbox,
} from './dtos';

@Roles('Administrator')
@WebSocketGateway({ namespace: 'dashboard' })
export class DashboardGateway extends WsAuthGateway {
  constructor(
    configService: ConfigService,
    wsAuthService: WsAuthService,
    private dashboardService: DashboardService,
  ) {
    super(configService, wsAuthService);
  }

  @SubscribeMessage(SOCKET_DASHBOARD_EVENTS.READ_STORAGE_DROPBOX)
  async getDropboxSpaceUsage(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchStorageDropbox,
  ) {
    const data = await this.dashboardService.getDropboxSpaceUsage();

    this.sendToCaller({
      socket: client,
      event: SOCKET_DASHBOARD_EVENTS.READ_STORAGE_DROPBOX,
      dto,
      data,
    });
  }

  @SubscribeMessage(SOCKET_DASHBOARD_EVENTS.READ_COUNT_USERS)
  async getRooms(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchCountUsers,
  ) {
    const data = await this.dashboardService.countUsers();

    this.sendToCaller({
      socket: client,
      event: SOCKET_DASHBOARD_EVENTS.READ_COUNT_USERS,
      dto,
      data,
    });
  }

  @SubscribeMessage(SOCKET_DASHBOARD_EVENTS.CHART_MESSAGES_ROOMS)
  async chartMessagesRooms(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchChartMessagesRoomsDto,
  ) {
    const records = await this.dashboardService.chartMessagesRooms(dto);

    this.sendToCaller({
      socket: client,
      event: SOCKET_DASHBOARD_EVENTS.CHART_MESSAGES_ROOMS,
      dto,
      data: { records },
    });
  }

  @SubscribeMessage(SOCKET_DASHBOARD_EVENTS.CHART_MESSAGES)
  async chartMessages(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchChartMessagesDto,
  ) {
    const records = await this.dashboardService.chartMessages(dto);

    this.sendToCaller({
      socket: client,
      event: SOCKET_DASHBOARD_EVENTS.CHART_MESSAGES,
      dto,
      data: { records },
    });
  }

  @SubscribeMessage(SOCKET_DASHBOARD_EVENTS.CHART_USER_ROLES)
  async chartUserRoles(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() dto: SearchChartUserRolesDto,
  ) {
    const records = await this.dashboardService.chartUserRoles();

    this.sendToCaller({
      socket: client,
      event: SOCKET_DASHBOARD_EVENTS.CHART_USER_ROLES,
      dto,
      data: { records },
    });
  }
}
