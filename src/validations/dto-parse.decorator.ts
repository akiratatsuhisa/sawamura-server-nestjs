import { SetMetadata } from '@nestjs/common';

export enum TransformType {
  None = 0,
  BodyTop = 1 << 0,
  BodyBottom = 1 << 1,
  QueryTop = 1 << 2,
  QueryBottom = 1 << 3,
  BodyAndQueryTop = BodyTop | QueryTop,
  BodyTopQueryBottom = BodyTop | QueryBottom,
  BodyAndQueryBottom = BodyBottom | QueryBottom,
  BodyBottomQueryTop = BodyBottom | QueryTop,
  Default = BodyAndQueryTop,
}

export function makeHasTransformType(data: TransformType) {
  /**
   * hasTransformType
   */
  return function (type: TransformType) {
    return type === 0 ? data === type : (data & type) === type;
  };
}

export const DTO_PARSE = 'dtoParse';

export const DtoParse = (type: TransformType) => SetMetadata(DTO_PARSE, type);
