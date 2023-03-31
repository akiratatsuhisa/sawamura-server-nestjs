import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Dropbox,
  DropboxAuth,
  Error as DropboxError,
  files as filesType,
  users as DropboxUsers,
} from 'dropbox';
import { readFile } from 'fs/promises';
import * as _ from 'lodash';
import { AppError, messages } from 'src/common/errors';
import { IFile } from 'src/helpers/file-type.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DropboxService {
  public dbxAuth: DropboxAuth;
  public dbx: Dropbox;

  constructor(private config: ConfigService) {
    this.dbxAuth = new DropboxAuth({
      clientId: this.config.get<string>('DROPBOX_CLIENT_ID'),
      clientSecret: this.config.get<string>('DROPBOX_CLIENT_SECRET'),
      refreshToken: this.config.get<string>('DROPBOX_REFRESH_TOKEN'),
    });

    this.dbx = new Dropbox({
      auth: this.dbxAuth,
    });
  }

  async getSpaceUsage() {
    const response = await this.dbx.usersGetSpaceUsage();
    return {
      used: response.result.used,
      allocated: (
        response.result.allocation as DropboxUsers.SpaceAllocationIndividual
      ).allocated,
    };
  }

  async filesUpload(
    files: Array<IFile>,
    arg: Omit<filesType.UploadArg, 'contents'>,
    options?: {
      throwOnFail?: boolean;
    },
  ) {
    const responses = await Promise.all(
      _.map(files, async (file) => {
        const uuid = uuidv4();
        const path = `/${arg.path}/${uuid}.${file.extension}`;
        try {
          const response = await this.dbx.filesUpload({
            ...arg,
            path,
            contents: file.buffer,
          });

          return {
            name: file.name,
            uuid,
            pathDisplay: response.result.path_display,
            ..._.pick(file, 'mime', 'extension'),
          };
        } catch (error) {
          if (options?.throwOnFail ?? true) {
            throw error as DropboxError<filesType.UploadError>;
          }

          return null;
        }
      }),
    );

    const result = _.filter(responses, (r) => !_.isNull(r));

    if (!_.size(result)) {
      throw new AppError.Argument(messages.FilesUploadFailed);
    }

    return result;
  }

  async fileUpload(file: IFile, arg: Omit<filesType.UploadArg, 'contents'>) {
    const path = `/${arg.path}/${file.name}.${file.extension}`;

    const response = await this.dbx.filesUpload({
      ...arg,
      path,
      contents: file.buffer ?? (await readFile(file.path)),
    });

    return {
      name: file.name,
      pathDisplay: response.result.path_display,
      ..._.pick(file, 'mime', 'extension'),
    };
  }

  private getPath(name: string, prefix?: string) {
    return '/' + (prefix ? `${prefix}/${name}` : name);
  }

  async fileDownload(name: string, prefix?: string) {
    const path = this.getPath(name, prefix);

    try {
      const response = await this.dbx.filesDownload({ path });

      // dropbox sdk fileBinary
      return (response.result as any).fileBinary as Buffer;
    } catch {
      throw new AppError.Argument(messages.FilesDownloadFailed);
    }
  }

  async fileRemove(name: string, prefix?: string) {
    const path = this.getPath(name, prefix);

    try {
      await this.dbx.filesDeleteV2({ path });

      return { name, path };
    } catch {
      throw new AppError.Argument(messages.FilesDeleteFailed);
    }
  }
}
