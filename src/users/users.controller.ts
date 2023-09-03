import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Roles } from 'src/auth/decorators';
import { FindOneParams } from 'src/common/dtos';
import { AppError } from 'src/common/errors';

import {
  ChangeUserRolesDto,
  SearchAdvancedUsersDto,
  SearchUsersDto,
} from './dtos';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Roles('Administrator')
  @Get('advanced')
  async searchAdvanced(@Query() dto: SearchAdvancedUsersDto) {
    return this.usersService.searchAdvanced(dto);
  }

  @Roles('Administrator')
  @Patch(':id/roles')
  async changeRoles(@Body() dto: ChangeUserRolesDto) {
    return this.usersService.changeRoles(dto);
  }

  @Get()
  async getAll(@Query() dto: SearchUsersDto) {
    return this.usersService.findAll(dto);
  }

  @Get(':id')
  async getById(@Param() dto: FindOneParams.Uuid) {
    const result = await this.usersService.findByUnique({ id: dto.id });
    if (!result) {
      throw new AppError.NotFound();
    }
    return result;
  }
}
