import { Regex } from '@akiratatsuhisa/sawamura-utils';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsFile, IsFileMime, MaxFileSize } from 'src/common/class-validator';
import { MessageFile } from 'src/constants';

export class CreateFileMessageDto {
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  name: string;

  @MaxLength(16)
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsFileMime(Regex.MessageFile.ALL_MIME_TYPES)
  @MaxFileSize(MessageFile.MAX_FILE_SIZE)
  @IsFile()
  data: Buffer;
}
export class CreateMessageDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((obj) => obj.content != '' || !(obj.files instanceof Array))
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  content?: string;

  @ValidateNested({ each: true })
  @ArrayMaxSize(32)
  @ArrayNotEmpty()
  @IsArray()
  @ValidateIf((obj) => obj.files != null || obj.content == '')
  @Type(() => CreateFileMessageDto)
  files?: Array<CreateFileMessageDto>;
}
