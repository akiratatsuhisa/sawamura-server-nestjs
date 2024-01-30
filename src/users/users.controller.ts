import { messages } from '@akiratatsuhisa/sawamura-utils';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators';
import { FindOneParams } from 'src/common/dtos';
import { AppError } from 'src/common/errors';

import { ChangeUserRolesDto, SearchUsersDto } from './dtos';
import { UsersService } from './users.service';

@Roles('Administrator')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAll(@Query() dto: SearchUsersDto) {
    return this.usersService.findAll(dto);
  }

  @Get(':id')
  async getById(@Param() dto: FindOneParams.Uuid) {
    const result = await this.usersService.findByUnique({ id: dto.id });

    if (!result) {
      throw new AppError.NotFound(messages.error.notFoundEntity).setParams({
        entity: 'User',
        id: dto.id,
      });
    }

    return result;
  }

  @Patch(':id/roles')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeRoles(@Body() dto: ChangeUserRolesDto) {
    await this.usersService.changeRoles(dto);
  }
}
