import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit
{
  private logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'query', emit: 'event' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    this.$on('query', (e) => {
      console.log('Query: ' + e.query);
      console.log('Params: ' + e.params);
      console.log('Duration: ' + e.duration + 'ms');
    });
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      app.close();
    });
  }

  async checkStatus() {
    try {
      await this.$transaction((tx) => tx.$executeRaw`SELECT 'OK';`, {
        timeout: 10000,
      });
      this.logger.debug(`Check Status: OK`);
      return true;
    } catch (error) {
      this.logger.error(`Check Status: BAD`);
      this.logger.error(`Check Status\n${error}`);
      return false;
    }
  }
}
