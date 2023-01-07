import { UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';

import { WsJwtAuthGuard } from './ws-jwt-auth.guard';
import { WsAuthService } from './ws-auth.service';
import * as _ from 'lodash';

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway()
export class WsAuthGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private wsAuthService: WsAuthService) {}

  afterInit(server: Server): void {
    //
  }

  handleConnection(client: SocketWithAuth): void {
    this.wsAuthService.init(client);
    this.wsAuthService.authenticate(client);
    this.wsAuthService.join(client);
  }

  handleDisconnect(client: SocketWithAuth): void {
    //
  }
}
