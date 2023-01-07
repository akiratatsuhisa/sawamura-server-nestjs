import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server } from 'http';
import { WsAuthGateway } from 'src/ws-auth/ws-auth.gateway';
import { WsAuthService } from 'src/ws-auth/ws-auth.service';

import { RoomsService } from './rooms.service';

@Injectable()
@WebSocketGateway({ namespace: 'chat' })
export class RoomsGateway extends WsAuthGateway {
  constructor(
    configService: ConfigService,
    wsAuthService: WsAuthService,
    private roomsService: RoomsService,
  ) {
    super(configService, wsAuthService);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): WsResponse<string> {
    return { event: 'message', data: 'Hello world' };
  }
}
