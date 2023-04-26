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
import { EmitId, SocketWithAuth } from 'src/ws-auth/ws-auth.types';

import { EVENTS, PREFIXES } from './constants';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { WsRolesGuard } from './guards/ws-roles.guard';
import { WsSecurityGuard } from './guards/ws-security.guard';
import {
  ISendToCallerOptions,
  ISendToUsersOptions,
  ISocketUser,
} from './interfaces/send-to-options.interface';
import { WsAuthInterceptor } from './ws-auth.interceptor';
import { WsAuthService } from './ws-auth.service';

@UseGuards(WsJwtAuthGuard, WsSecurityGuard, WsRolesGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    exceptionFactory,
  }),
)
@UseInterceptors(WsAuthInterceptor)
@UseFilters(GlobalWsExceptionsFilter)
@WebSocketGateway({
  cors: true,
})
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

    if (socketIds.length) {
      this.logger.log(
        `Authenticating connection to server ${this.namespace.name}`,
      );
    }

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

  sendToCaller<D extends Record<string, unknown>>(
    options: ISendToCallerOptions<D>,
  ) {
    const { socket, event, data } = options;

    const callerData: D & EmitId = _.cloneDeep(data);
    if (_.isObject(callerData) && !_.isArray(callerData)) {
      callerData.__emit_id__ = (options.dto as EmitId).__emit_id__;
    }

    socket?.emit(event, callerData);
  }

  sendToUsers<D extends Record<string, unknown>>(
    options: ISendToUsersOptions<D>,
  ): Array<ISocketUser> {
    const { socket, event, data, userIds } = options;

    const rooms = this.namespace.adapter.rooms;

    const { connected, connectedSilent, result } = _(
      userIds instanceof Array ? userIds : [userIds],
    ).reduce(
      (group, userId) => {
        const connected = `${PREFIXES.SOCKET_USER}:${userId}`;
        const connectedSilent = `${PREFIXES.SOCKET_USER_SILENT}:${userId}`;

        const type: 'connected' | 'connectedSilent' | 'unconnected' = rooms.has(
          connected,
        )
          ? 'connected'
          : rooms.has(connectedSilent)
          ? 'connectedSilent'
          : 'unconnected';

        group[type].push(
          type === 'connected'
            ? connected
            : type === 'connectedSilent'
            ? connectedSilent
            : userId,
        );
        group.result.push({
          userId,
          type,
        });

        return group;
      },
      {
        connected: [],
        connectedSilent: [],
        unconnected: [],
        result: [],
      } as {
        connected: Array<string>;
        connectedSilent: Array<string>;
        unconnected: Array<string>;
        result: Array<{
          userId: string;
          type: 'connected' | 'connectedSilent' | 'unconnected';
        }>;
      },
    );

    if (!_.isNil(socket)) {
      this.sendToCaller<D>(options);

      socket
        .to(connected)
        .to(connectedSilent)
        .emit(`${EVENTS.LISTENER}:${event}`, data);
    } else {
      this.namespace
        .to(connected)
        .to(connectedSilent)
        .emit(`${EVENTS.LISTENER}:${event}`, data);
    }

    return result;
  }
}
