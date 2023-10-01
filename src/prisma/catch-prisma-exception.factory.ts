import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppError } from 'src/common/errors';

import { PrismaService } from './prisma.service';

const logger = new Logger(PrismaService.name);

export function catchPrismaException(exception: unknown) {
  if (
    exception instanceof Prisma.PrismaClientInitializationError ||
    exception instanceof Prisma.PrismaClientRustPanicError ||
    exception instanceof Prisma.PrismaClientValidationError ||
    exception instanceof Prisma.PrismaClientUnknownRequestError ||
    exception instanceof Prisma.PrismaClientKnownRequestError
  ) {
    logger.error(exception.message);
    return new AppError.Prisma().setEvent(exception['_subscribeMessage']);
  }

  return exception;
}
