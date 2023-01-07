import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';

import { IdentityPrincipal, IdentityUser } from 'src/auth/identity.class';
import { AuthOptions, SocketWithAuth } from './ws-auth.type';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class WsAuthService {
  private secret: string;

  constructor(
    private config: ConfigService,
    private redisService: RedisService,
  ) {
    this.secret = this.config.get<string>('SECRET');
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
  authenticate(socket: SocketWithAuth, options?: AuthOptions): void {
    try {
      const token =
        options?.token ??
        socket.handshake.auth.token ??
        socket.handshake.headers.authorization.split(' ')[1];

      const payload = jwt.verify(token, this.secret, {
        ignoreExpiration: false,
      }) as jwt.JwtPayload;

      socket.user = new IdentityUser(payload);
      socket.expires = _.isNumber(payload.exp)
        ? Number(payload.exp) * 1000
        : undefined;

      socket.join(socket.user.id);
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
