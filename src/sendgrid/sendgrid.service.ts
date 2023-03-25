import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mailService from '@sendgrid/mail';
import * as fs from 'fs/promises';
import * as hbs from 'handlebars';
import * as path from 'path';

import { IForgotPasswordContext } from './interfaces';

@Injectable()
export class SendgridService {
  public readonly sender: string;

  constructor(private readonly configService: ConfigService) {
    this.sender = configService.get<string>('SENDGRID_SENDER');

    mailService.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  async send(
    data: mailService.MailDataRequired | mailService.MailDataRequired[],
    isMultiple?: boolean,
  ) {
    const transport = await mailService.send(data, isMultiple);

    return transport;
  }

  async renderTemplate(
    name: 'forgot-password',
    context: IForgotPasswordContext,
  ): Promise<string>;
  async renderTemplate(name: string, context: object): Promise<string> {
    const input = await fs.readFile(
      path.join(__dirname, '..', '..', 'templates', 'emails', `${name}.hbs`),
      'utf-8',
    );

    const template = hbs.compile(input);

    return template(context);
  }
}