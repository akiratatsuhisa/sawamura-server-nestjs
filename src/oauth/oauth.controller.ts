import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { IdentityUser, Public, User } from 'src/auth/decorators';

import { UnlinkProviderDto } from './dtos';
import { GithubAuthGuard, GoogleAuthGuard } from './guards';
import { OauthService } from './oauth.service';

@Controller('oauth')
export class OauthController {
  constructor(private oauthService: OauthService) {}

  @Get('providers')
  async getProviders(@User() user: IdentityUser) {
    return this.oauthService.findProviders(user);
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async google(@Req() req: Request, @Ip() ip: string) {
    return this.oauthService.login(req.user as any, ip);
  }

  @Get('github')
  @Public()
  @UseGuards(GithubAuthGuard)
  async github(@Req() req: Request, @Ip() ip: string) {
    return this.oauthService.login(req.user as any, ip);
  }

  @Post('linkProvider')
  @HttpCode(HttpStatus.CREATED)
  async linkProvider(@User() user: IdentityUser) {
    return this.oauthService.generateToken(user);
  }

  @Delete('unlinkProvider')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkProvider(
    @Body() dto: UnlinkProviderDto,
    @User() user: IdentityUser,
  ) {
    await this.oauthService.unlinkProvider(dto, user);
  }
}
