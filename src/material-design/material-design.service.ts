import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance, create } from 'axios';
import { readFile } from 'fs/promises';
import { IFile } from 'src/helpers';

import { ThemeResponse } from './material-design.interfaces';

@Injectable()
export class MaterialDesignService {
  private readonly axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseURL = this.configService.get<string>('MATERIAL_COLORS_UTILS_URL');

    this.axiosInstance = create({ baseURL });
  }

  async generateThemeFromImage(image: IFile) {
    const blob = new Blob([
      image.buffer ? image.buffer : await readFile(image.path),
    ]);

    const form = new FormData();
    form.append('image', blob);

    try {
      const { data } = await this.axiosInstance.post<ThemeResponse>(
        '/image',
        form,
      );

      return data;
    } catch (error) {
      return { themeSource: null, themeStyle: null } satisfies ThemeResponse;
    }
  }

  async generateThemeFromSource(source: number) {
    try {
      const { data } = await this.axiosInstance.post<ThemeResponse>('/source', {
        source,
      });

      return data;
    } catch (error) {
      return { themeSource: null, themeStyle: null } satisfies ThemeResponse;
    }
  }
}
