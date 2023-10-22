import { GraphService } from '@akiratatsuhisa/sawamura-graph-module';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly graphService: GraphService,
  ) {}

  ping() {
    return {
      status: HttpStatus.OK,
      message: 'pong',
    };
  }

  @Cron('0 0 0,12 * * *')
  async taskAuthenticate() {
    await Promise.all([
      this.prismaService.checkStatus(),
      this.graphService.checkStatus(),
    ]);
  }
}
