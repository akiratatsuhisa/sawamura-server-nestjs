import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { FindOneParams } from 'src/validations/find-one.validation';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get()
  async getAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async getById(@Param() params: FindOneParams.Uuid) {
    const result = await this.usersService.findByUnique({ id: params.id });
    if (!result) {
      throw new NotFoundException(params.id);
    }
    return result;
  }
}
