import { ValidationError } from '@nestjs/common';
import * as _ from 'lodash';
import { AppError } from 'src/common/errors';

export enum ExceptionFactoryType {
  Errors = 1 << 0,
  Data = 1 << 1,
  All = ExceptionFactoryType.Errors | ExceptionFactoryType.Data,
}

export function parseData(errors: Array<ValidationError>) {
  return _(errors)
    .map((error) => ({
      [error.property]: {
        message: _.find(error.constraints),
        children: error.children?.length
          ? parseData(error.children)
          : undefined,
      },
    }))
    .thru((result) => {
      return Object.assign({}, ...result) as Record<string, unknown>;
    });
}

export function parseErrors(errors: Array<ValidationError>) {
  return _(errors)
    .map((error) => [
      _.find(error.constraints),
      ...(error.children?.length ? parseErrors(error.children) : []),
    ])
    .flatten()
    .filter((text) => !_.isNil(text));
}

export function exceptionFactory(
  errors: ValidationError[],
  type: ExceptionFactoryType = ExceptionFactoryType.All,
) {
  const result = new AppError.BadDto();
  if ((type & ExceptionFactoryType.Data) === ExceptionFactoryType.Data) {
    result.setData(parseData(errors));
  }

  if ((type & ExceptionFactoryType.Errors) === ExceptionFactoryType.Errors) {
    result.setErrors(parseErrors(errors));
  }

  return result;
}
