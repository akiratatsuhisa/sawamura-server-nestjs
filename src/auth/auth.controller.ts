import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AppError } from 'src/common/errors';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { User } from './decorators/users.decorator';
import {
  ForgotPasswordDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './dtos';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(@Request() req, @Ip() ip: string) {
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
}
