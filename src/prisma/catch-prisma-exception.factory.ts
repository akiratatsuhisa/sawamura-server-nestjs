import { Prisma } from '@prisma/client';
import { AppError } from 'src/common/errors';

export function catchPrismaException(exception: unknown) {
  if (
    exception instanceof Prisma.PrismaClientInitializationError ||
    exception instanceof Prisma.PrismaClientRustPanicError ||
    exception instanceof Prisma.PrismaClientValidationError ||
    exception instanceof Prisma.PrismaClientUnknownRequestError ||
    exception instanceof Prisma.PrismaClientKnownRequestError
  ) {
    return new AppError.Prisma();
  }
  return exception;
}
