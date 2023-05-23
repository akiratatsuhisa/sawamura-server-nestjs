import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { IdentityUser, Public, User } from 'src/auth/decorators';
import { COMMON_FILE } from 'src/constants';
import { Multer } from 'src/helpers/multer.helper';

import {
  DeleteRoomImageDto,
  SearchImageDto,
  SearchMessageFileDto,
  UpdateRoomImageDto,
  UpdateRoomThemeDto,
} from './dtos';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get(':id/:type(photo|cover)')
  @Public()
  async getImage(
    @Query() dto: SearchImageDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { mimeType, buffer } = await this.roomsService.getImage(dto);

    res.set({
      'Content-Type': mimeType,
    });
    return new StreamableFile(buffer);
  }

  @Put(':id/:type(photo|cover)')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateImage(
    @UploadedFile()
    file: Express.Multer.File,
    @Query() dto: UpdateRoomImageDto,
    @User() user: IdentityUser,
  ) {
    const isCover = dto.type === 'cover';

    const { unlink } = Multer.validateFiles(file, {
      fileSize: COMMON_FILE.IMAGE_MAX_FILE_SIZE,
      mimeTypeRegex: COMMON_FILE.IMAGE_MIME_TYPES,
      required: true,
      dimensions: isCover
        ? undefined
        : {
            equal: true,
            width: 1024,
            height: 1024,
          },
    });

    try {
      await this.roomsService.updateImage(
        Multer.convertToIFile(file, {
          fileName: dto.type,
        }),
        dto,
        user,
      );
    } catch {
      await unlink();
    }
  }

  @Delete(':id/:type(photo|cover)')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @Query() dto: DeleteRoomImageDto,
    @User() user: IdentityUser,
  ) {
    await this.roomsService.deleteImage(dto, user);
  }

  @Patch(':id/theme')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateTheme(
    @Body() dto: UpdateRoomThemeDto,
    @User() user: IdentityUser,
  ) {
    await this.roomsService.updateTheme(dto, user);
  }

  @Get(':roomId/:name')
  async getFile(
    @Query() dto: SearchMessageFileDto,
    @Res({ passthrough: true }) res: Response,
    @User() user: IdentityUser,
  ) {
    const { buffer } = await this.roomsService.getFile(dto, user);

    return new StreamableFile(buffer);
  }
}
