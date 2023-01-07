import { SetMetadata } from '@nestjs/common';

export enum TransformType {
  Default = 0,
  Body = 1 << 0,
  Query = 1 << 1,
  BodyAndQuery = 1 << 2,
}

export const DTO_PARSE = 'dtoParse';

export const DtoParse = (type: TransformType) => SetMetadata(DTO_PARSE, type);
