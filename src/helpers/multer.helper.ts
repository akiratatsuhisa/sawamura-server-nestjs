import { unlink } from 'fs/promises';
import { imageSize } from 'image-size';
import _ from 'lodash';
import { diskStorage } from 'multer';
import path from 'path';
import { AppError } from 'src/common/errors';
import { IFile } from 'src/helpers';
import { v4 as uuidv4 } from 'uuid';

export namespace Multer {
  export function declareStorageEngine(...paths: string[]) {
    return diskStorage({
      destination: path.join(__dirname, '..', '..', 'temp', ...paths),
      filename: (_req, file, cb) => {
        const uuid = uuidv4();
        cb(null, `${uuid}${path.extname(file.originalname).toLowerCase()}`);
      },
    });
  }

  /**
   * @param throwOnError @type {boolean} @default {true}
   */
  export interface ValidateFilesOptions {
    throwOnError?: boolean;
    required?: boolean;
    fileSize: number;
    mimeTypeRegex: RegExp;
    dimensions: {
      equal?: boolean;
      width: number;
      height: number;
    };
  }

  export async function unlinkFiles(
    value: Express.Multer.File | Array<Express.Multer.File>,
  ) {
    value = _.isArray(value) ? value : [value];

    await Promise.all(value.map(async (file) => unlink(file.path)));
  }

  export function validateFiles(
    value: Express.Multer.File | Array<Express.Multer.File>,
    options: ValidateFilesOptions,
  ) {
    value = _.isArray(value) ? value : [value];

    const errors: Array<string> = [];
    if (options.required && !value.length) {
      errors.push(AppError.Messages.FilesRequired);
    }

    const [validFiles, invalidFiles] = _.partition(value, (file) => {
      const currentErrors: Array<string> = [];

      if (file.size > options.fileSize) {
        currentErrors.push(
          AppError.Messages.OverMaxFileSize(
            file.originalname,
            options.fileSize,
          ),
        );
      } else if (!options.mimeTypeRegex.test(file.mimetype)) {
        currentErrors.push(
          AppError.Messages.InvalidFileMimeType(
            file.originalname,
            options.mimeTypeRegex.toString(),
          ),
        );
      } else if (options.dimensions) {
        const { equal, width, height } = options.dimensions;
        const dimensions = imageSize(file.path);
        if (
          equal
            ? width !== dimensions.width || height !== dimensions.height
            : width < dimensions.width || height < dimensions.height
        ) {
          currentErrors.push(
            AppError.Messages.InvalidFileDimensions(
              file.originalname,
              options.dimensions,
            ),
          );
        }
      }

      errors.push(...currentErrors);
      return !currentErrors.length;
    });

    const hasError = !!errors.length;

    if ((options.throwOnError ?? true) && hasError) {
      Multer.unlinkFiles(value);

      throw new AppError.BadDto().setErrors(errors);
    } else if (invalidFiles.length) {
      Multer.unlinkFiles(invalidFiles);
    }

    return {
      files: validFiles,
      hasError,
      errors,
      unlink: () => Multer.unlinkFiles(validFiles),
    };
  }

  export function convertToIFile(
    file: Express.Multer.File,
    options?: {
      fileName?: string;
      type?: string;
    },
  ) {
    return {
      name: options?.fileName ?? file.filename,
      buffer: file.buffer,
      type: options?.type ?? 'Files',
      extension:
        path.extname(file.originalname).toLowerCase()?.substring(1) ?? 'txt',
      mime: file.mimetype,
      path: file.path,
    } satisfies IFile;
  }
}
