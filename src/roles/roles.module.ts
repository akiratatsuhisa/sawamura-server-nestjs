import { Module } from '@nestjs/common';
import { DashboardModule } from 'src/dashboard/dashboard.module';

import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [DashboardModule],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}
