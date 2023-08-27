import path from 'path';

export { IFile } from 'src/helpers/file.interface';

export async function importFileType() {
  const {
    fileTypeFromBuffer,
  }: {
    fileTypeFromBuffer: (
      buffer: Uint8Array | ArrayBuffer,
    ) => Promise<{ ext: string; mime: string } | undefined>;
  } = await eval(`import('file-type')`);

  return {
    fileTypeFromBuffer,
  };
}

export function getFileExtension(fileName) {
  return path.extname(fileName)?.substring(1) || 'txt';
}

/**
 * file-type package is for detecting binary-based file formats, not text-based formats like .txt, .csv, .svg, etc.
 */
export function getMimeTypeFromExtension(fileName: string) {
  const extension = getFileExtension(fileName);

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
