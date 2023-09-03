import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import _ from 'lodash';
export class ChangeUserRolesDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsArray()
  roleIds: Array<string>;
}
