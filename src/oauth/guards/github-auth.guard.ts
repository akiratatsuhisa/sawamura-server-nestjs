import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppError } from 'src/common/errors';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  async canActivate(context: ExecutionContext) {
    try {
      const result = await (super.canActivate(context) as Promise<boolean>);
      return result;
    } catch (error) {
      throw new AppError.Unauthenticated();
    }
  }
}
