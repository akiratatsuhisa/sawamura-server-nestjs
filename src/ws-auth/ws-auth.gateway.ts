import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as _ from 'lodash';

import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';

import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { WsRolesGuard } from './guards/ws-roles.guard';
import { WsAuthService } from './ws-auth.service';

@UseGuards(WsJwtAuthGuard, WsRolesGuard)
@WebSocketGateway()
export class WsAuthGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger(WsAuthGateway.name);

  @WebSocketServer() server: Server;

  constructor(private wsAuthService: WsAuthService) {}

  afterInit(_server: Server): void {
    //
  }

  handleConnection(client: SocketWithAuth): void {
    this.wsAuthService.init(client);
    this.wsAuthService.authenticate(client);
    this.wsAuthService.join(client);

    const message =
      `ClientId(${client.id}) joinned` +
      (client.user ? ` as UserId(${client.user.id})` : '');
    this.logger.log(message);
  }

  handleDisconnect(client: SocketWithAuth): void {
    const message =
      `ClientId(${client.id}) left` +
      (client.user ? ` as UserId(${client.user.id})` : '');
    this.logger.log(message);
  }
}
