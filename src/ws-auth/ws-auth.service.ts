import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';

import { IdentityPrincipal, IdentityUser } from 'src/auth/identity.class';
import { AuthOptions, SocketWithAuth } from './ws-auth.type';

@Injectable()
export class WsAuthService {
  private secret: string;
  constructor(private config: ConfigService) {
    this.secret = this.config.get<string>('SECRET');
  }

  init(socket: SocketWithAuth) {
    socket.principal = new IdentityPrincipal();

    socket.isExpires = (seconds?: number) => {
      if (_.isNil(socket.expires)) {
        return true;
      }

      return moment(socket.expires).subtract(seconds, 'seconds').isBefore();
    };
  }

  /**
   * ClearAuth
   * Delete user info
   * Delete expires token
   * @param socket socket.io client
   */
  clearAuth(socket: SocketWithAuth) {
    socket.user = undefined;
    socket.expires = undefined;

    socket.principal.user = socket.user;
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
    } catch (error) {
      socket.user = undefined;
      socket.expires = undefined;
    }

    socket.principal.user = socket.user;
  }

  join(socket: SocketWithAuth) {
    if (
      !_.isNil(socket.principal.user?.id) &&
      socket.principal.isAuthenticated
    ) {
      socket.join(socket.user.id);
    }
  }

  leave(socket: SocketWithAuth) {
    if (!_.isNil(socket.principal.user?.id)) {
      socket.leave(socket.user.id);
    }
  }
}
