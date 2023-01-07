import { SetMetadata } from '@nestjs/common';

export enum TransformType {
  Default = 'Default',
  Body = 'Body',
}

export const PARAMS_AS_BODY = 'paramsAsBody';
export const ParamsAsBody = (type: TransformType = TransformType.Default) =>
  SetMetadata(PARAMS_AS_BODY, type);
