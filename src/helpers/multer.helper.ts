import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import { MESSAGE_FILE } from 'src/constants';
import { v4 as uuidv4 } from 'uuid';

export namespace Multer {
  export function declareStorageEngine() {
    return diskStorage({
      destination: path.join(__dirname, '..', '..', 'temp'),
      filename: (_req, file, cb) => {
        const uuid = uuidv4();
        cb(null, `${uuid}${extname(file.originalname).toLowerCase()}`);
      },
    });
  }

  /**
   * @param fileSize {number} the max file size (in bytes)
   * @param regExp {RegExp} /\.(gif|jpe?g|png)$/
   * @returns fileFilter
   */
  export function declareFileFilter(
    fileSize: number,
    regExp: RegExp,
  ): MulterOptions['fileFilter'] {
    return (_req, file, cb) => {
      if (!file.originalname.match(regExp)) {
        return cb(new Error('Only image files are allowed!'), false);
      }

      cb(null, true);
    };
  }

  export const officeFileFilter = Multer.declareFileFilter(
    MESSAGE_FILE.MAX_FILE_SIZE,
    /\.(txt|zip|accdb|accde|csv|docx?|dotx?|eml|mdb|mde|mpp|mpt|msg|odp|ods|odt|one|pdf|potx?|pp(s|sx)|pptx?|potx?|pst|pub|rtf|tsv|txt|vsd(x|s)?|vs(s|t)?|xls(x|b)?|xlt(x|m)?|xps)$/,
  );

  export const imageFileFilter = Multer.declareFileFilter(
    2097152, // 2 MiB
    /\.(gif|jpe?g|tiff?|png|webp|bmp)$/,
  );
}
