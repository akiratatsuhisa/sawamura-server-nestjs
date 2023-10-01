import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IdentityUser, User } from 'src/auth/decorators';

import {
  CreateWhinnyDto,
  DeleteWhinnyDto,
  SearchWhinniesDto,
  SearchWhinnyDto,
  SearchWhinnyReactionsDto,
  UpdateWhinnyReactionDto,
} from './dtos';
import { WhinniesService } from './whinnies.service';

@Controller('whinnies')
export class WhinniesController {
  constructor(private whinniesService: WhinniesService) {}

  @Get('/feeds')
  async getFeeds(@User() user: IdentityUser) {
    return this.whinniesService.getFeeds(user);
  }

  @Get()
  async getAll(@Query() dto: SearchWhinniesDto, @User() user: IdentityUser) {
    return this.whinniesService.getAll(dto, user);
  }

  @Get(':urlId')
  async getById(@Query() dto: SearchWhinnyDto, @User() user: IdentityUser) {
    return this.whinniesService.getById(dto, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateWhinnyDto, @User() user: IdentityUser) {
    return this.whinniesService.create(dto, user);
  }

  @Delete(':urlId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Body() dto: DeleteWhinnyDto, @User() user: IdentityUser) {
    await this.whinniesService.delete(dto, user);
  }

  @Get(':urlId/reactions')
  async getReactions(@Query() dto: SearchWhinnyReactionsDto) {
    return this.whinniesService.getReactions(dto);
  }

  @Patch(':urlId/reactions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async react(
    @Body() dto: UpdateWhinnyReactionDto,
    @User() user: IdentityUser,
  ) {
    await this.whinniesService.react(dto, user);
  }
}
