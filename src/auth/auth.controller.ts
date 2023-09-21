import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { AppError } from 'src/common/errors';
import { COMMON_FILE } from 'src/constants';
import { Multer } from 'src/helpers';

import { AuthService } from './auth.service';
import { IdentityUser, Public, User } from './decorators';
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateEmailDto,
  UpdateImageDto,
  UpdatePasswordDto,
  UpdateThemeDto,
} from './dtos';
import { LocalAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: Request, @Ip() ip: string) {
    return this.authService.login(req.user as any, ip);
  }

  @Post('register')
  @Public()
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Delete('delete')
  async deleteAccount(@User() user: IdentityUser) {
    return this.authService.deleteAccount(user);
  }

  @Post('confirmEmail')
  @Public()
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.authService.confirmEmail(dto);
  }

  @Post('forgotPassword')
  @Public()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('resetPassword')
  @Public()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refreshToken')
  @Public()
  async refreshToken(
    @Headers('Refresh-Token') token: string,
    @Ip() ip: string,
  ) {
    if (!token) {
      throw new AppError.Argument(`Not Found Token in header`);
    }

    return this.authService.refreshToken(token, ip);
  }

  @Patch('refreshToken')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeRefreshToken(
    @Headers('Refresh-Token') headerToken: string,
    @Body() dto: RefreshTokenDto,
    @User('id') userId: string,
    @Ip() ip: string,
  ) {
    const token = dto.value ?? headerToken;

    if (!token) {
      throw new AppError.Argument(`Not Found Token in header or body`);
    }

    return this.authService.revoke(token, userId, ip);
  }

  @Put(':type(photo|cover)')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateImage(
    @Query() dto: UpdateImageDto,
    @UploadedFile()
    file: Express.Multer.File,
    @User() user: IdentityUser,
  ) {
    const isCover = dto.type === 'cover';

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
        Multer.convertToIFile(file, {
          fileName: isCover ? 'background' : 'avatar',
        }),
        dto,
        user,
      );
    } finally {
      await unlink();
    }
  }

  @Patch('theme')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateTheme(@Body() dto: UpdateThemeDto, @User() user: IdentityUser) {
    await this.authService.updateTheme(dto, user);
  }

  @Patch('password')
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @User('id') userId: string,
    @Ip() ip: string,
  ) {
    return this.authService.updatePassword(dto, userId, ip);
  }

  @Post('verifyEmail')
  async verifyEmail(@User('id') userId: string) {
    await this.authService.requestVerifyEmail(userId);
  }

  @Patch('email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateEmail(@Body() dto: UpdateEmailDto, @User('id') userId: string) {
    await this.authService.updateEmail(dto, userId);
  }

  @Get('profile/pdf')
  async profilePdf(
    @Res({ passthrough: true }) res: Response,
    @User() user: IdentityUser,
  ) {
    const buffer = await this.authService.profilePdf(user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="profile.pdf"`,
    });

    return new StreamableFile(buffer);
  }
}
