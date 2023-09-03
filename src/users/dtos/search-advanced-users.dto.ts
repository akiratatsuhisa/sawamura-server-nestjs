import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import _ from 'lodash';
import { PaginationOffset } from 'src/common/dtos';
import { EmailState, SearchMatch } from 'src/common/enum';

export const SearchAdvancedUsersSort = {
  username: 'username',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

export type SearchAdvancedUsersSort =
  typeof SearchAdvancedUsersSort[keyof typeof SearchAdvancedUsersSort];

export class SearchAdvancedUsersSortDto {
  @IsIn(_.values(SearchAdvancedUsersSort))
  @IsString()
  @IsNotEmpty()
  field: SearchAdvancedUsersSort;

  @IsIn(_.values(Prisma.SortOrder))
  @IsString()
  @IsNotEmpty()
  order: Prisma.SortOrder;

  static initDefault() {
    const obj = new SearchAdvancedUsersSortDto();
    obj.field = SearchAdvancedUsersSort.createdAt;
    obj.order = Prisma.SortOrder.asc;
    return obj;
  }
}

export class SearchAdvancedUsersDto extends PaginationOffset {
  @MaxLength(255)
  @IsString()
  @IsOptional()
  username?: string;

  @MaxLength(255)
  @IsString()
  @IsOptional()
  name?: string;

  @MaxLength(450)
  @IsString()
  @IsOptional()
  email?: string;

  @IsIn(_.values(EmailState), { each: true })
  @ArrayUnique()
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  emailStates?: Array<EmailState>;

  @ArrayUnique()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsOptional()
  roleIds?: Array<string>;

  @IsIn(_.values(SearchMatch))
  @IsString()
  @IsOptional()
  roleMode?: SearchMatch;

  @ValidateNested()
  @IsObject()
  @IsOptional()
  @Type(() => SearchAdvancedUsersSortDto)
  sort: SearchAdvancedUsersSortDto = SearchAdvancedUsersSortDto.initDefault();
}
