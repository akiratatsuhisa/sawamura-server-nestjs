import { Module } from '@nestjs/common';
import { DropboxModule } from 'src/dropbox/dropbox.module';
import { RoomsModule } from 'src/rooms/rooms.module';

import { DashboardGateway } from './dashboard.gateway';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [DropboxModule, RoomsModule],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardService, DashboardGateway],
})
export class DashboardModule {}
