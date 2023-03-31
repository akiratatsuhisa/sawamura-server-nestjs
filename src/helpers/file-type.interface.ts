export interface IFile {
  name: string;
  buffer: Buffer;
  type: string;
  extension: string;
  mime: string;
  // disk storage temp file only for multer upload only
  path?: string;
}
