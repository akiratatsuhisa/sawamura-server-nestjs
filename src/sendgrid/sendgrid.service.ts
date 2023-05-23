import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, MailService } from '@sendgrid/mail';
import { readFile } from 'fs/promises';
import { compile } from 'handlebars';
import path from 'path';

import { IConfirmEmailContext, IForgotPasswordContext } from './interfaces';

@Injectable()
export class SendgridService {
  public readonly sender: string;
  private readonly mailService: MailService;

  constructor(private readonly configService: ConfigService) {
    this.sender = configService.get<string>('SENDGRID_SENDER');

    this.mailService = new MailService();

    this.mailService.setApiKey(
      this.configService.get<string>('SENDGRID_API_KEY'),
    );
  }

  async send(
    data: MailDataRequired | MailDataRequired[],
    isMultiple?: boolean,
  ) {
    const transport = await this.mailService.send(data, isMultiple);

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
    const input = await readFile(
      path.join(__dirname, '..', '..', 'templates', 'emails', `${name}.hbs`),
      'utf-8',
    );

    const template = compile(input);

    return template(context);
  }
}
