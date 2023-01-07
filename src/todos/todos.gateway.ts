import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';

import { SortTodoDto } from './dtos';
import { TodosService } from './todos.service';

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
