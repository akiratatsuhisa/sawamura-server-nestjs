import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';
import { IdentityUser, User } from 'src/ws-auth/ws-users.decorator';

import { SortTodoDto } from './dtos';
import { TodosService } from './todos.service';

@Injectable()
@WebSocketGateway({ namespace: 'todos' })
export class TodosGateway extends WsAuthGateway {
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
    @User() user: IdentityUser,
  ): Promise<WsResponse<string>> {
    await this.todosService.sort(data, user);

    return {
      event: 'events',
      data: `Hello todo id(${data.id}) change sort(${data.sort})!`,
    };
  }
}
