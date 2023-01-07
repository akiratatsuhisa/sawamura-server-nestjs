import { Module } from '@nestjs/common';

import { TodosController } from './todos.controller';
import { TodosGateway } from './todos.gateway';
import { TodosService } from './todos.service';

@Module({
  providers: [TodosGateway, TodosService],
  controllers: [TodosController],
  exports: [TodosGateway, TodosService],
})
export class TodosModule {}
