import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import { IdentityUser, User } from 'src/auth/decorators/users.decorator';
import { COMMON_FILE } from 'src/constants';
import { Multer } from 'src/helpers/multer.helper';

import { SOCKET_ROOM_EVENTS } from './constants';
import { SearchMessageFileDto, SearchRoomPhotoDto } from './dtos';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(
    private roomsService: RoomsService,
    private roomsGateway: RoomsGateway,
  ) {}

  @Get(':id/photo')
  @Public()
  async getImage(
    @Query() dto: SearchRoomPhotoDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { mimeType, buffer } = await this.roomsService.getRoomPhoto(dto);

    res.set({
      'Content-Type': mimeType,
    });
    return new StreamableFile(buffer);
  }

  @Patch(':id/photo')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateImage(
    @UploadedFile()
    file: Express.Multer.File,
    @Query() dto: SearchRoomPhotoDto,
    @User() user: IdentityUser,
  ) {
    const { unlink } = Multer.validateFiles(file, {
      fileSize: COMMON_FILE.IMAGE_MAX_FILE_SIZE,
      mimeTypeRegex: COMMON_FILE.IMAGE_MIME_TYPES,
      required: true,
      dimensions: {
        equal: true,

        width: 1024,
        height: 1024,
      },
    });

    try {
      const room = await this.roomsService.updateRoomPhoto(
        Multer.convertToIFile(file, {
          fileName: 'photo',
        }),
        dto,
        user,
      );

      this.roomsGateway.sendToUsers({
        event: SOCKET_ROOM_EVENTS.UPDATE_ROOM_PHOTO,
        dto,
        data: room,
        userIds: this.roomsGateway.mapSendToRoomMembers(room),
      });
    } finally {
      await unlink();
    }
  }

  @Get(':roomId/:name')
  async getFile(
    @Query() dto: SearchMessageFileDto,
    @Res() res: Response,
    @User() user: IdentityUser,
  ) {
    const { buffer } = await this.roomsService.getFile(dto, user);

    return res.send(buffer);
  }
}
