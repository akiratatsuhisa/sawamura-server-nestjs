import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { IdentityUser, User } from 'src/auth/decorators/users.decorator';

import { SearchMessageFileDto } from './dtos';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get(':roomId/:name')
  async getFile(
    @Query() dto: SearchMessageFileDto,
    @User() user: IdentityUser,
    @Res() res: Response,
  ) {
    const buffer = await this.roomsService.getFile(dto, user);

    return res.send(buffer);
  }
}
