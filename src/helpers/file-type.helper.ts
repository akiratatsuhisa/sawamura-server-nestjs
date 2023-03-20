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
