import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sendgridMail from '@sendgrid/mail';
import * as fs from 'fs/promises';
import * as hbs from 'handlebars';
import * as path from 'path';

import { IConfirmEmailContext, IForgotPasswordContext } from './interfaces';

@Injectable()
export class SendgridService {
  public readonly sender: string;

  constructor(private readonly configService: ConfigService) {
    this.sender = configService.get<string>('SENDGRID_SENDER');

    sendgridMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  async send(
    data: sendgridMail.MailDataRequired | sendgridMail.MailDataRequired[],
    isMultiple?: boolean,
  ) {
    const transport = await sendgridMail.send(data, isMultiple);

    return transport;
  }

  async renderTemplate(
    name: 'confirm-email',
    context: IConfirmEmailContext,
  ): Promise<string>;
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
