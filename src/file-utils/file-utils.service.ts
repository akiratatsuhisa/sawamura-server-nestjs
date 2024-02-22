import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { compile } from 'handlebars';
import path from 'path';
import { launch } from 'puppeteer';

import { IProfileContext } from './interfaces';

@Injectable()
export class FileUtilsService {
  async exportPdf(html: string): Promise<Buffer> {
    const browser = await launch({ headless: 'shell' });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const buffer = await page.pdf({
      format: 'A4',
      margin: {
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
      },
      printBackground: true,
    });

    await browser.close();

    return buffer;
  }

  async renderPdf(name: 'profile', context: IProfileContext): Promise<string>;
  async renderPdf(name: string, context: object): Promise<string> {
    const input = await readFile(
      path.join(__dirname, '..', '..', 'templates', 'pdfs', `${name}.hbs`),
      'utf-8',
    );

    const template = compile(input);

    return template(context);
  }
}
