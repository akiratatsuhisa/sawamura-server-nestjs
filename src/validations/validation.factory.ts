import { BadRequestException, ValidationError } from '@nestjs/common';

export function parseError(errors: Array<ValidationError>) {
  return errors;
}

export function exceptionFactory(errors: ValidationError[]) {
  return new BadRequestException(parseError(errors), 'Validation Error');
}
