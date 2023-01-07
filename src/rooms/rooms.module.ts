import { Module } from '@nestjs/common';

import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  providers: [RoomsService, RoomsGateway],
  exports: [RoomsService, RoomsGateway],
})
export class RoomsModule {}
