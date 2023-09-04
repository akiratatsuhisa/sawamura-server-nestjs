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

export const SearchUsersSort = {
  username: 'username',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

export type SearchUsersSort =
  typeof SearchUsersSort[keyof typeof SearchUsersSort];

export class SearchUsersSortDto {
  @IsIn(_.values(SearchUsersSort))
  @IsString()
  @IsNotEmpty()
  field: SearchUsersSort;

  @IsIn(_.values(Prisma.SortOrder))
  @IsString()
  @IsNotEmpty()
  order: Prisma.SortOrder;

  static initDefault() {
    const obj = new SearchUsersSortDto();
    obj.field = SearchUsersSort.createdAt;
    obj.order = Prisma.SortOrder.asc;
    return obj;
  }
}

export class SearchUsersDto extends PaginationOffset {
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
  @Type(() => SearchUsersSortDto)
  sort: SearchUsersSortDto = SearchUsersSortDto.initDefault();
}
