import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IdentityPrincipal, IdentityUser } from 'src/auth/decorators';

import { SocketWithAuth } from '../ws-auth.types';

export { IdentityPrincipal, IdentityUser };

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const client: SocketWithAuth = ctx.switchToWs().getClient();
    const user: IdentityUser = client.user;

    return data ? user?.[data] : user;
  },
);

export const Principal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const client: SocketWithAuth = ctx.switchToWs().getClient();
    const principal: IdentityPrincipal = client.principal;

    return principal;
  },
);
