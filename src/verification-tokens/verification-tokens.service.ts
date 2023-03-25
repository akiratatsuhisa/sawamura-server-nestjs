import { Injectable } from '@nestjs/common';
import { VerificationTokenType } from '@prisma/client';
import * as moment from 'moment';
import { AppError, messages } from 'src/common/errors';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VerificationTokensService {
  constructor(private prisma: PrismaService) {}

  async generateToken(userId: string) {
    return this.prisma.verificationToken.create({
      data: {
        userId,
        type: VerificationTokenType.ResetPassword,
        expires: moment().add(5, 'minutes').toDate(),
      },
    });
  }

  async revokeToken(token: string) {
    return this.prisma.$transaction(async (tx) => {
      const verificationToken = await tx.verificationToken.findFirst({
        where: { token },
      });

      if (
        !verificationToken ||
        verificationToken.revoked ||
        moment(verificationToken.expires).isSameOrBefore()
      ) {
        throw new AppError.Argument(messages.InvalidVerificationToken);
      }

      return tx.verificationToken.update({
        data: { revoked: moment().toDate() },
        where: {
          id: verificationToken.id,
        },
      });
    });
  }

  async getTokenActive(token: string) {
    return this.prisma.$transaction(async (tx) => {
      const verificationToken = await tx.verificationToken.findFirst({
        where: { token },
      });

      if (
        !verificationToken ||
        verificationToken.revoked ||
        moment(verificationToken.expires).isSameOrBefore()
      ) {
        throw new AppError.Argument(messages.InvalidVerificationToken);
      }

      return verificationToken;
    });
  }
}
