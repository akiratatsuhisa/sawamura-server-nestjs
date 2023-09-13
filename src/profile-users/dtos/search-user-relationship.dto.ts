import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import _ from 'lodash';
import { PaginationCursor } from 'src/common/dtos';

export enum SearchUserRelationshipType {
  FollowersYouFollow = 'followers-you-follow',
  Followers = 'followers',
  Following = 'following',
}

export class SearchUserRelationshipDto extends PaginationCursor {
  @IsIn(_.values(SearchUserRelationshipType))
  @IsString()
  @IsNotEmpty()
  type: SearchUserRelationshipType;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cursor?: string;
}
