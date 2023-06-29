import { Injectable } from '@nestjs/common';
import { VerificationTokenType } from '@prisma/client';
import moment from 'moment';
import { AppError } from 'src/common/errors';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VerificationTokensService {
  constructor(private prisma: PrismaService) {}

  async generateToken(
    userId: string,
    type: VerificationTokenType,
    expires?: Date,
  ) {
    return this.prisma.verificationToken.create({
      data: {
        userId,
        type,
        expires: expires ?? moment().add(5, 'minutes').toDate(),
      },
    });
  }

  async revokeToken(token: string, type: VerificationTokenType) {
    const verificationToken = await this.prisma.verificationToken.findFirst({
      where: { token, type },
    });

    if (
      !verificationToken ||
      verificationToken.revoked ||
      moment(verificationToken.expires).isSameOrBefore()
    ) {
      throw new AppError.Argument(AppError.Messages.InvalidVerificationToken);
    }

    return this.prisma.verificationToken.update({
      data: { revoked: moment().toDate() },
      where: {
        id: verificationToken.id,
      },
    });
  }

  async getTokenActive(token: string, type: VerificationTokenType) {
    const verificationToken = await this.prisma.verificationToken.findFirst({
      where: { token, type },
    });

    if (
      !verificationToken ||
      verificationToken.revoked ||
      moment(verificationToken.expires).isSameOrBefore()
    ) {
      throw new AppError.Argument(AppError.Messages.InvalidVerificationToken);
    }

    return verificationToken;
  }
}
