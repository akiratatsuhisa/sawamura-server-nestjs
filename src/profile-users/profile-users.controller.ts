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
  SearchUserRelationshipDto,
  SearchUserRelationshipType,
} from './dtos';
import { ProfileUsersService } from './profile-users.service';

@Controller('profileUsers')
export class ProfileUsersController {
  constructor(private profileUsersService: ProfileUsersService) {}

  @Get('advanced')
  async searchAdvanced(@Query() dto: SearchAdvancedUsersDto) {
    return this.profileUsersService.searchAdvanced(dto);
  }

  @Get(':username')
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

  @Get(':username/:type(photo|cover)')
  @Public()
  async getImageLink(@Query() dto: SearchUserImageDto) {
    return this.profileUsersService.getImageLink(dto);
  }

  @Get(
    `:username/relationships/:type(${SearchUserRelationshipType.FollowersYouFollow}|${SearchUserRelationshipType.Followers}|${SearchUserRelationshipType.Following})`,
  )
  async searchRelationships(
    @Query() dto: SearchUserRelationshipDto,
    @User() user: IdentityUser,
  ) {
    return this.profileUsersService.searchRelationships(dto, user);
  }

  @Patch(':username/relationships')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeRelationship(
    @Body() dto: ChangeUserRelationshipDto,
    @User() user: IdentityUser,
  ) {
    await this.profileUsersService.changeRelationship(dto, user);
  }
}
