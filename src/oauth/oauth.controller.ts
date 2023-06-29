import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IdentityUser, Public, User } from 'src/auth/decorators';

import { UnlinkProviderDto } from './dtos';
import { GithubAuthGuard, GoogleAuthGuard } from './guards';
import { OauthExceptionsFilter } from './oauth.filter';
import { OauthService } from './oauth.service';

@Controller('oauth')
@UseFilters(OauthExceptionsFilter)
export class OauthController {
  constructor(private oauthService: OauthService) {}

  private async oauth(
    req: Request,
    res: Response,
    ip: string,
    redirectUrl: string,
  ) {
    const redirectLink = await this.oauthService.login(
      req.user as any,
      ip,
      redirectUrl,
    );

    return res.redirect(redirectLink);
  }

  @Get('providers')
  async getProviders(@User() user: IdentityUser) {
    return this.oauthService.findProviders(user);
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async google(
    @Req() req: Request,
    @Res() res: Response,
    @Ip() ip: string,
    @Query('redirectUrl') redirectUrl: string,
  ) {
    return this.oauth(req, res, ip, redirectUrl);
  }

  @Get('github')
  @Public()
  @UseGuards(GithubAuthGuard)
  async github(
    @Req() req: Request,
    @Res() res: Response,
    @Ip() ip: string,
    @Query('redirectUrl') redirectUrl: string,
  ) {
    return this.oauth(req, res, ip, redirectUrl);
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
