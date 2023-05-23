import { Module } from '@nestjs/common';

import { MaterialDesignService } from './material-design.service';

@Module({
  providers: [MaterialDesignService],
  exports: [MaterialDesignService],
})
export class MaterialDesignModule {}
