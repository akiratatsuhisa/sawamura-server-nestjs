import {
  Body,
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Patch,
} from '@nestjs/common';

import { ParamsAsBody } from 'src/validations/params-as-body.decorator';
import { IdentityUser, User } from 'src/auth/decorators/users.decorator';
import { TodosService } from './todos.service';

import {
  CreateTodoDto,
  UpdateTodoDto,
  DeleteTodoDto,
  SortTodoDto,
} from './dtos';

@ParamsAsBody()
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
