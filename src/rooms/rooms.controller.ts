import { Regex } from '@akiratatsuhisa/sawamura-utils';
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
import { CommonFile } from 'src/constants';
import { Multer } from 'src/helpers';

import {
  DeleteRoomImageDto,
  SearchAdvancedRoomsDto,
  SearchImageDto,
  SearchMessageFileDto,
  UpdateRoomImageDto,
  UpdateRoomThemeDto,
} from './dtos';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get('advanced')
  async searchAdvanced(
    @Query() dto: SearchAdvancedRoomsDto,
    @User() user: IdentityUser,
  ) {
    return this.roomsService.searchAdvanced(dto, user);
  }

  @Get(':id/:type(photo|cover)')
  @Public()
  async getImageLink(@Query() dto: SearchImageDto) {
    return this.roomsService.getImageLink(dto);
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
      fileSize: CommonFile.IMAGE_MAX_FILE_SIZE,
      mimeTypeRegex: Regex.CommonFile.IMAGE_MIME_TYPES,
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

  /**
   *  @deprecated
   * To cache files, use the getFileLink method
   *
   * @Get(':roomId/:name')
   */
  @Get(':roomId/files/:name')
  async getFile(
    @Query() dto: SearchMessageFileDto,
    @Res({ passthrough: true }) res: Response,
    @User() user: IdentityUser,
  ) {
    const { buffer } = await this.roomsService.getFile(dto, user);

    return new StreamableFile(buffer);
  }

  @Get(':roomId/:name')
  async getFileLink(
    @Query() dto: SearchMessageFileDto,
    @User() user: IdentityUser,
  ) {
    return this.roomsService.getFileLink(dto, user);
  }
}
