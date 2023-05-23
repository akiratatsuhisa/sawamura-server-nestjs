import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, verify } from 'jsonwebtoken';
import _ from 'lodash';
import moment from 'moment';
import { IdentityPrincipal, IdentityUser } from 'src/auth/decorators';
import { RedisService } from 'src/redis/redis.service';

import { PREFIXES } from './constants';
import { IAuthOptions } from './interfaces';
import { SocketWithAuth } from './ws-auth.types';

@Injectable()
export class WsAuthService {
  private secret: string;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.secret = this.configService.get<string>('SECRET');
  }

  init(socket: SocketWithAuth) {
    socket.principal = new IdentityPrincipal();

    socket.isExpires = (milliseconds?: number) => {
      if (_.isNil(socket.expires)) {
        return true;
      }

      return moment(socket.expires)
        .subtract(milliseconds, 'milliseconds')
        .isBefore();
    };
  }

  /**
   * Authenticate
   * Set user info
   * Set expires token
   * @param socket socket.io client
   * @param {string} token json web token
   */
  authenticate(socket: SocketWithAuth, options?: IAuthOptions): void {
    try {
      const token =
        options?.token ??
        socket.handshake.auth.token ??
        socket.handshake.headers.authorization.split(' ')[1];

      const payload = verify(token, this.secret, {
        ignoreExpiration: false,
      }) as JwtPayload;

      socket.user = new IdentityUser(payload);
      socket.expires = _.isNumber(payload.exp)
        ? Number(payload.exp) * 1000
        : undefined;

      if (socket.handshake.query.silent !== 'true') {
        socket.join(`${PREFIXES.SOCKET_USER}:${socket.user.id}`);
      }
      socket.join(`${PREFIXES.SOCKET_USER_SILENT}:${socket.user.id}`);
    } catch (error) {
      socket.user = undefined;
      socket.expires = undefined;
    }

    socket.principal.user = socket.user;
  }

  async zAddAuth(socket: SocketWithAuth, milliseconds?: number): Promise<void> {
    await this.redisService.db.zAdd(`auth:${socket.nsp.name}`, {
      value: socket.id,
      score: moment(socket.expires)
        .subtract(milliseconds, 'milliseconds')
        .valueOf(),
    });
  }

  async zRemAuth(socket: SocketWithAuth): Promise<void> {
    await this.redisService.db.zRem(`auth:${socket.nsp.name}`, socket.id);
  }

  async zGetAndRemByExpires(namespaceName: string, milliseconds?: number) {
    const score = moment().subtract(milliseconds, 'milliseconds').valueOf();

    const data = await this.redisService.db.zRangeByScore(
      `auth:${namespaceName}`,
      '-inf',
      `(${score}`,
    );

    await this.redisService.db.zRemRangeByScore(
      `auth:${namespaceName}`,
      '-inf',
      `(${score}`,
    );

    return data;
  }
}
