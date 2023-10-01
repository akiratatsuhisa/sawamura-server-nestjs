import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { AppError } from 'src/common/errors';
import { catchPrismaException } from 'src/prisma/catch-prisma-exception.factory';
import { EVENTS } from 'src/ws-auth/constants';
import { SocketWithAuth } from 'src/ws-auth/ws-auth.types';

@Catch()
export class GlobalWsExceptionsFilter extends BaseWsExceptionFilter {
  private logger = new Logger(GlobalWsExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToWs();

    const client = context.getClient<SocketWithAuth>();

    exception = catchPrismaException(exception);

    if (exception instanceof AppError.BasicError) {
      this.logger.error(exception.message);

      exception.setData(context.getData());
      client.emit(exception.getEvent(), exception.getResponseBody());

      /**
       * global exception throw
       */
      if (exception.getEvent() !== EVENTS.EXCEPTION) {
        client.emit(EVENTS.EXCEPTION, exception.getResponseBody());
      }

      // cancel super call
      return;
    }

    super.catch(exception, host);
  }
}
