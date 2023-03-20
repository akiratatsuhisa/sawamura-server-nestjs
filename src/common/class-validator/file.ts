import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';

export function isFileBuffer(value: unknown) {
  return Buffer.isBuffer(value);
}

export function IsFileBuffer(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isFileBuffer',
      validator: {
        validate: (value) => isFileBuffer(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be a buffer',
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

  const fileType = await import('file-type');

  const { mime } = await fileType.fileTypeFromBuffer(value);

  return mimeRegex.test(mime);
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

export async function maxFileSize(value: Buffer, maxSize: number) {
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
      async: true,
      validator: {
        validate: async (value, args) =>
          maxFileSize(value, args?.constraints[0]),
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
