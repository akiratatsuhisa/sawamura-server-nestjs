import { Socket } from 'socket.io';
import { IdentityPrincipal, IdentityUser } from 'src/auth/identity.class';

export abstract class SocketWithAuth extends Socket {
  isAuthenticating: boolean;

  expires?: number;
  abstract isExpires(seconds?: number): boolean;

  user?: IdentityUser;
  principal: IdentityPrincipal;
}

export type EmitId = {
  __emit_id__?: string;
};
