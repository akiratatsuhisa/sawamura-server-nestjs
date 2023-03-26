import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';
import { importFileType } from 'src/helpers/file-type.helper';

export function isFile(value: unknown) {
  return Buffer.isBuffer(value);
}

export function IsFile(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isFileBuffer',
      validator: {
        validate: (value) => isFile(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be a buffer',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

export function maxFileSize(value: Buffer, maxSize: number) {
  return Buffer.byteLength(value) <= maxSize;
}

export function MaxFileSize(
  maxSize: number,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'maxFileSize',
      constraints: [maxSize],
      validator: {
        validate: (value, args) => maxFileSize(value, args?.constraints[0]),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            eachPrefix +
            '$property file size must be less than or equal $constraints1',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

export async function isFileMime(value: Buffer, mimeRegex: RegExp | string) {
  if (typeof mimeRegex === 'string') {
    mimeRegex = new RegExp(mimeRegex, 'i');
  }

  const { fileTypeFromBuffer } = await importFileType();

  const result = await fileTypeFromBuffer(value);

  return !result || mimeRegex.test(result.mime);
}

export function IsFileMime(
  mimeRegex: RegExp | string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isFileMime',
      constraints: [mimeRegex],
      async: true,
      validator: {
        validate: async (value, args) =>
          isFileMime(value, args?.constraints[0]),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be match $constraints1',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
