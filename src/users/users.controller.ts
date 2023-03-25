import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppError } from 'src/common/errors';
import { FindOneParams } from 'src/validations/find-one.validation';

import { SearchUsersDto } from './dtos';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAll(@Query() dto: SearchUsersDto) {
    return this.usersService.findAll(dto);
  }

  @Get(':id')
  async getById(@Param() params: FindOneParams.Uuid) {
    const result = await this.usersService.findByUnique({ id: params.id });
    if (!result) {
      throw new AppError.NotFound();
    }
    return result;
  }
}
