import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IdentityUser, IdentityPrincipal } from '../identity.class';

export { IdentityUser, IdentityPrincipal };

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: IdentityUser = request.user;

    return data ? user?.[data] : user;
  },
);

export const Principal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const principal: IdentityPrincipal = request.principal;

    return principal;
  },
);
