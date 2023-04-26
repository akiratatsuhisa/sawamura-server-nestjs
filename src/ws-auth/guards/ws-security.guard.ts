import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { AppError } from 'src/common/errors';

@Injectable()
export class WsSecurityGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToWs().getClient();

    if (await this.authService.verifySecurityStamp(user.securityStamp)) {
      return true;
    }

    throw new AppError.Unauthenticated();
  }
}
