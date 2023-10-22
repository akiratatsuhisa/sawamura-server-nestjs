import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/decorators';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(['', 'ping'])
  @Public()
  ping() {
    return this.appService.ping();
  }
}
