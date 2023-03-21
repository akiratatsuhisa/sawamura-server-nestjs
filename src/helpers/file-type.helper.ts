import * as path from 'path';

export type { IFile } from 'src/helpers/file-type.interface';

export async function importFileTypeFromBuffer() {
  const {
    fileTypeFromBuffer: func,
  }: {
    fileTypeFromBuffer: (
      buffer: Uint8Array | ArrayBuffer,
    ) => Promise<{ ext: string; mime: string } | undefined>;
  } = await eval(`import('file-type')`);

  return func;
}

/**
 * file-type package is for detecting binary-based file formats, not text-based formats like .txt, .csv, .svg, etc.
 */
export function getMimeTypeFromExtension(fileName: string) {
  const extension = path.extname(fileName)?.substring(1) || 'txt';

  switch (extension) {
    case 'svg':
      return {
        ext: extension,
        mime: 'image/svg+xml',
      };
    case 'csv':
      return {
        ext: extension,
        mime: 'text/csv',
      };
    case 'txt':
    default:
      return {
        ext: 'txt',
        mime: 'text/plain',
      };
  }
}
