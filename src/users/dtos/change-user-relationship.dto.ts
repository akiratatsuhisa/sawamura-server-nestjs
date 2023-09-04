import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import _ from 'lodash';

export enum UserRelationshipState {
  Follow = 'follow',
  Unfollow = 'unfollow',
}

export class ChangeUserRelationshipDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsIn(_.values(UserRelationshipState))
  @IsString()
  @IsNotEmpty()
  relationshipState: UserRelationshipState;
}
