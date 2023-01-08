import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { AppError } from 'src/common/errors';
import { catchPrismaException } from 'src/prisma/catch-prisma-exception.factory';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.type';

@Catch()
export class GlobalWsExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToWs();

    const client = context.getClient<SocketWithAuth>();

    exception = catchPrismaException(exception);

    if (exception instanceof AppError.BasicError) {
      client.emit(exception.getEvent(), exception.getResponseBody());
      return;
    }

    super.catch(exception, host);
  }
}
