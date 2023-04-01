import { SocketWithAuth } from '../ws-auth.types';

export interface ISendToCallerOptions<D extends Record<string, unknown>> {
  socket?: SocketWithAuth;
  event: string;
  dto: unknown;
  data: D;
}

export interface ISendToUsersOptions<D extends Record<string, unknown>>
  extends ISendToCallerOptions<D> {
  userIds: string | Array<string>;
}

export interface ISocketUser {
  userId: string;
  type: 'connected' | 'connectedSilent' | 'unconnected';
}
