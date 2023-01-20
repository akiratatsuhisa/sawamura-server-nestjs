import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AppError } from 'src/common/errors';

@Injectable()
export class WsAuthInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const subscribeMessage = this.reflector.getAllAndOverride<string>(
      'message',
      [context.getHandler()],
    );

    return next.handle().pipe(
      tap({
        error: (error: unknown) => {
          if (error instanceof AppError.BasicError) {
            error.setEvent(subscribeMessage);
          } else {
            (error as { _subscribeMessage: string })._subscribeMessage =
              subscribeMessage;
          }
        },
      }),
    );
  }
}
