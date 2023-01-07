import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { IdentityUser, User } from 'src/auth/decorators/users.decorator';

import {
  CreateTodoDto,
  DeleteTodoDto,
  SortTodoDto,
  UpdateTodoDto,
} from './dtos';
import { TodosService } from './todos.service';

@Controller('todos')
export class TodosController {
  constructor(private todosService: TodosService) {}
  @Get()
  async search() {
    return this.todosService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateTodoDto, @User() user: IdentityUser) {
    return this.todosService.create(dto, user);
  }

  @Put(':id')
  async update(@Body() dto: UpdateTodoDto, @User() user: IdentityUser) {
    return this.todosService.update(dto, user);
  }

  @Delete(':id')
  async delete(@Body() dto: DeleteTodoDto) {
    return this.todosService.delete(dto);
  }

  @Patch(':id/sort')
  async sort(@Body() dto: SortTodoDto, @User() user: IdentityUser) {
    return this.todosService.sort(dto, user);
  }
}
