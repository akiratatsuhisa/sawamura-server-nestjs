import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import * as _ from 'lodash';
import { Namespace, Server } from 'socket.io';
import { GlobalWsExceptionsFilter } from 'src/validations/global-ws-exceptions.filter';
import { exceptionFactory } from 'src/validations/validation.factory';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';

import { EVENTS, PREFIXES } from './constants';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { WsRolesGuard } from './guards/ws-roles.guard';
import { ISendToUsersOptions } from './interfaces/send-to-users-options.interface';
import { WsAuthInterceptor } from './ws-auth.interceptor';
import { WsAuthService } from './ws-auth.service';

@UseGuards(WsJwtAuthGuard, WsRolesGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    exceptionFactory,
  }),
)
@UseInterceptors(WsAuthInterceptor)
@UseFilters(GlobalWsExceptionsFilter)
@WebSocketGateway({ cors: true })
export class WsAuthGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly socketOffset: number;
  private readonly wsAuthOffset: number;

  private logger = new Logger(WsAuthGateway.name);

  public server: Server;
  public namespace: Namespace;

  constructor(
    protected configService: ConfigService,
    protected wsAuthService: WsAuthService,
  ) {
    this.socketOffset =
      Number(this.configService.get<number>('REFRESH_TOKEN_SOCKET_OFFSET')) ??
      60000;
    this.wsAuthOffset =
      Number(this.configService.get<number>('REFRESH_TOKEN_WSAUTH_OFFSET')) ??
      1500;
  }

  afterInit(serverOrNamespace: unknown): void {
    if (serverOrNamespace instanceof Server) {
      this.server = serverOrNamespace;
    }
    if (serverOrNamespace instanceof Namespace) {
      this.server = serverOrNamespace.server;
      this.namespace = serverOrNamespace;
    }
  }

  async handleConnection(client: SocketWithAuth): Promise<void> {
    this.wsAuthService.init(client);
    this.wsAuthService.authenticate(client);

    if (!client.principal.isAuthenticated) {
      client.disconnect();
      return;
    }

    await this.wsAuthService.zAddAuth(client, this.socketOffset);

    const message = `ClientId(${client.id}) joinned as UserId(${client.user.id})`;
    this.logger.log(message);
  }

  async handleDisconnect(client: SocketWithAuth): Promise<void> {
    if (!client.principal.isAuthenticated) {
      return;
    }

    await this.wsAuthService.zRemAuth(client);

    const message = `ClientId(${client.id}) left as UserId(${client.user.id})`;
    this.logger.log(message);
  }

  @Cron('0 * * * * *')
  async taskAuthenticate() {
    const socketIds = await this.wsAuthService.zGetAndRemByExpires(
      this.namespace.name,
    );

    const sockets = this.namespace.sockets;

    _.forEach(socketIds, (socketId) => {
      if (!sockets.has(socketId)) {
        return;
      }

      const socket = sockets.get(socketId) as SocketWithAuth;
      if (socket?.isAuthenticating) {
        return;
      }
      socket.isAuthenticating = true;

      socket.emit(EVENTS.AUTHENTICATE, 'Plz auth');

      setTimeout(() => {
        if (socket?.isAuthenticating) {
          socket.disconnect();
        }
      }, this.wsAuthOffset);
    });
  }

  @SubscribeMessage(EVENTS.AUTHENTICATE)
  async authenticate(
    @MessageBody() data: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.wsAuthService.authenticate(client, { token: data });
    if (client.principal.isAuthenticated) {
      await this.wsAuthService.zAddAuth(client, this.socketOffset);
      client.isAuthenticating = false;
    }
  }

  sendToUsers<D = unknown>(options: ISendToUsersOptions<D>) {
    const { event, userIds, data, unconnectedCallback } = options;
    const rooms = this.namespace.adapter.rooms;

    const { connected, connectedSilent, unconnected } = _(
      userIds instanceof Array ? userIds : [userIds],
    ).reduce(
      (group, userId) => {
        const connected = `${PREFIXES.SOCKET_USER}:${userId}`;
        const connectedSilent = `${PREFIXES.SOCKET_USER_SILENT}:${userId}`;
        if (rooms.has(connected)) {
          group.connected.push(connected);
        } else if (rooms.has(connectedSilent)) {
          group.connectedSilent.push(connectedSilent);
        } else {
          group.unconnected.push(userId);
        }
        return group;
      },
      {
        connected: [],
        connectedSilent: [],
        unconnected: [],
      } as {
        connected: Array<string>;
        connectedSilent: Array<string>;
        unconnected: Array<string>;
      },
    );

    this.namespace.to(connected).emit(event, data);

    const silentData =
      _.isObject(data) && !_.isArray(data) ? { _event: event, ...data } : data;
    this.namespace.to(connectedSilent).emit('silent', silentData);

    if (unconnectedCallback && unconnected.length) {
      unconnectedCallback(unconnected, data);
    }
  }
}
