import { Module } from '@nestjs/common';
import { DropboxModule } from 'src/dropbox/dropbox.module';

import { DashboardGateway } from './dashboard.gateway';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [DropboxModule],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardService, DashboardGateway],
})
export class DashboardModule {}
