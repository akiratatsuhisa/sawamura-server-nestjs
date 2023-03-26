import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AppError } from 'src/common/errors';
import { COMMON_FILE } from 'src/constants';
import { Multer } from 'src/helpers/multer.helper';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { IdentityUser, User } from './decorators/users.decorator';
import {
  ForgotPasswordDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  SearchImageDto,
} from './dtos';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(@Req() req, @Ip() ip: string) {
    return this.authService.login(req.user, ip);
  }

  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('forgotPassword')
  @Public()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('resetPassword')
  @Public()
  async resetPassword(@Body() registerDto: ResetPasswordDto) {
    return this.authService.resetPassword(registerDto);
  }

  @Post('refreshToken')
  @Public()
  async refreshToken(@Headers('refreshtoken') token: string, @Ip() ip: string) {
    if (!token) {
      throw new AppError.Argument(`Not Found Token in header`);
    }

    return this.authService.refreshToken(token, ip);
  }

  @Patch('refreshToken')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeRefreshToken(
    @Headers('refreshtoken') headerToken: string,
    @Body() refreshTokenDto: RefreshTokenDto,
    @User('id') userId: string,
    @Ip() ip: string,
  ) {
    const token = refreshTokenDto.value ?? headerToken;

    if (!token) {
      throw new AppError.Argument(`Not Found Token in header or body`);
    }

    return this.authService.revoke(token, userId, ip);
  }

  @Get(':type(photo|cover)')
  @Public()
  async getImage(
    @Query() dto: SearchImageDto,
    @Param('type') type: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { mimeType, buffer } = await this.authService.getImage(
      type === 'cover' ? 'coverUrl' : 'photoUrl',
      dto.username,
    );

    res.set({
      'Content-Type': mimeType,
    });
    return new StreamableFile(buffer);
  }

  @Patch(':type(photo|cover)')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateImage(
    @Param('type') type: string,
    @UploadedFile()
    file: Express.Multer.File,
    @User() user: IdentityUser,
  ) {
    const isCover = type === 'cover';

    const { unlink } = Multer.validateFiles(file, {
      fileSize: isCover
        ? COMMON_FILE.IMAGE_MAX_FILE_SIZE * 2
        : COMMON_FILE.IMAGE_MAX_FILE_SIZE,
      mimeTypeRegex: COMMON_FILE.IMAGE_MIME_TYPES,
      required: true,
      dimensions: {
        equal: true,
        ...(isCover
          ? {
              width: 1280,
              height: 720,
            }
          : {
              width: 1024,
              height: 1024,
            }),
      },
    });

    try {
      await this.authService.updateImage(
        isCover ? 'coverUrl' : 'photoUrl',
        Multer.convertToIFile(file, {
          fileName: isCover ? 'background' : 'avatar',
        }),
        user,
      );
    } finally {
      await unlink();
    }
  }
}
