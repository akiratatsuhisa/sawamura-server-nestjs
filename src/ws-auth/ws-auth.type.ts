import { Socket } from 'socket.io';
import { IdentityPrincipal, IdentityUser } from 'src/auth/identity.class';

export interface AuthOptions {
  token?: string;
}

export class SocketWithAuth extends Socket {
  expires?: number;
  isExpires: (seconds?: number) => boolean;

  user?: IdentityUser;
  principal: IdentityPrincipal;
}
