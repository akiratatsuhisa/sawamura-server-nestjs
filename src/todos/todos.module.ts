import { Module } from '@nestjs/common';

import { TodosGateway } from './todos.gateway';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  providers: [TodosGateway, TodosService],
  controllers: [TodosController],
  exports: [TodosGateway, TodosService],
})
export class TodosModule {}
