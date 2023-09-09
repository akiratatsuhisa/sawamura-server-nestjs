import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { IdentityUser, Public, User } from 'src/auth/decorators';
import { AppError } from 'src/common/errors';

import {
  ChangeUserRelationshipDto,
  SearchAdvancedUsersDto,
  SearchUserImageDto,
} from './dtos';
import { ProfileUsersService } from './profile-users.service';

@Controller('users')
export class ProfileUsersController {
  constructor(private profileUsersService: ProfileUsersService) {}

  @Get('advanced')
  async searchAdvanced(@Query() dto: SearchAdvancedUsersDto) {
    return this.profileUsersService.searchAdvanced(dto);
  }

  @Get('profile/:username')
  async searchProfileByUsername(
    @Param('username') username: string,
    @Res({ passthrough: true }) res: Response,
    @User() user: IdentityUser,
  ) {
    const result = await this.profileUsersService.searchProfileUnique({
      username,
    });
    if (!result) {
      throw new AppError.NotFound();
    }
    const isFollowing = await this.profileUsersService.isFollowingUser(
      { username },
      user,
    );
    res.set({ 'Has-Following': isFollowing });
    return result;
  }

  @Get('profile/:username/:type(photo|cover)')
  @Public()
  async getImageLink(@Query() dto: SearchUserImageDto) {
    return this.profileUsersService.getImageLink(dto);
  }

  @Patch('profile/:username/relationship')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeRelationship(
    @Body() dto: ChangeUserRelationshipDto,
    @User() user: IdentityUser,
  ) {
    await this.profileUsersService.changeRelationship(dto, user);
  }
}
