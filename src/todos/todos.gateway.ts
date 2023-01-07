import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

import { SortTodoDto } from './dtos';
import { TodosService } from './todos.service';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';

@Injectable()
@WebSocketGateway({ namespace: 'todos' })
export class TodosGateway extends WsAuthGateway {
  @WebSocketServer() server: Server;

  constructor(
    configService: ConfigService,
    wsAuthService: WsAuthService,
    private todosService: TodosService,
  ) {
    super(configService, wsAuthService);
  }

  @SubscribeMessage('events')
  async handleEvent(
    @MessageBody() data: SortTodoDto,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<WsResponse<string>> {
    await this.todosService.sort(data, client.user);

    return {
      event: 'events',
      data: `Hello todo id(${data.id}) change sort(${data.sort})!`,
    };
  }
}
