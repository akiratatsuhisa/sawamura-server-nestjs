import { Prisma } from '@prisma/client';
import { AppError } from 'src/helpers/errors.helper';

export function catchPrismaException(exception: unknown) {
  if (
    exception instanceof Prisma.PrismaClientInitializationError ||
    exception instanceof Prisma.PrismaClientRustPanicError ||
    exception instanceof Prisma.PrismaClientValidationError ||
    exception instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return new AppError.Prisma();
  }
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    if ((exception.code = 'P2025')) {
      return new AppError.NotFound((exception.meta as any).cause);
    }
    return new AppError.Prisma();
  }
  return exception;
}
