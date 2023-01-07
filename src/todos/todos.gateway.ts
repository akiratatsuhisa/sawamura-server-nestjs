import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';

@Injectable()
@WebSocketGateway({ namespace: 'todos' })
export class TodosGateway extends WsAuthGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('events')
  handleEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): WsResponse<string> {
    return { event: 'events', data: `Hello ${data}!` };
  }
}
