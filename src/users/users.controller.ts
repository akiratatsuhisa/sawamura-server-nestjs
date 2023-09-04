import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { IdentityUser, Roles, User } from 'src/auth/decorators';
import { FindOneParams } from 'src/common/dtos';
import { AppError } from 'src/common/errors';

import {
  ChangeUserRelationshipDto,
  ChangeUserRolesDto,
  SearchAdvancedUsersDto,
  SearchUsersDto,
} from './dtos';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('advanced')
  async searchAdvanced(@Query() dto: SearchAdvancedUsersDto) {
    return this.usersService.searchAdvanced(dto);
  }

  @Get('profile/:username')
  async searchProfileByUsername(
    @Param('username') username: string,
    @Res({ passthrough: true }) res: Response,
    @User() user: IdentityUser,
  ) {
    const result = await this.usersService.searchProfileUnique({ username });
    if (!result) {
      throw new AppError.NotFound();
    }
    const isFollowing = await this.usersService.isFollowingUser(
      { username },
      user,
    );
    res.set({ 'Has-Following': isFollowing });
    return result;
  }

  @Patch('profile/:username/relationship')
  async changeRelationship(
    @Body() dto: ChangeUserRelationshipDto,
    @User() user: IdentityUser,
  ) {
    return this.usersService.changeRelationship(dto, user);
  }

  @Roles('Administrator')
  @Get()
  async getAll(@Query() dto: SearchUsersDto) {
    return this.usersService.findAll(dto);
  }

  @Roles('Administrator')
  @Get(':id')
  async getById(@Param() dto: FindOneParams.Uuid) {
    const result = await this.usersService.findByUnique({ id: dto.id });
    if (!result) {
      throw new AppError.NotFound();
    }
    return result;
  }

  @Roles('Administrator')
  @Patch(':id/roles')
  async changeRoles(@Body() dto: ChangeUserRolesDto) {
    return this.usersService.changeRoles(dto);
  }
}
