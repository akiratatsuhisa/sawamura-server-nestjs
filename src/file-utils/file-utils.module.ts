import { Module } from '@nestjs/common';

import { FileUtilsService } from './file-utils.service';

@Module({
  providers: [FileUtilsService],
  exports: [FileUtilsService],
})
export class FileUtilsModule {}
