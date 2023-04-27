import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';

import {
  DTO_PARSE,
  makeHasTransformType,
  TransformType,
} from './dto-parse.decorator';

@Injectable()
export class DtoParseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type =
      this.reflector.getAllAndOverride<TransformType>(DTO_PARSE, [
        context.getClass(),
        context.getHandler(),
      ]) ?? TransformType.Default;

    const hasTransformType = makeHasTransformType(type);

    const { body, params, query }: Request = context
      .switchToHttp()
      .getRequest();

    if (hasTransformType(TransformType.None)) {
      return next.handle();
    }

    /**
     * params as query
     */
    if (
      (hasTransformType(TransformType.QueryTop) ||
        hasTransformType(TransformType.QueryBottom)) &&
      _.isObject(query)
    ) {
      _(params).forEach((value, key) => {
        if (
          hasTransformType(TransformType.QueryBottom) &&
          !_.isUndefined(query[key])
        ) {
          return;
        }
        query[key] = value;
      });
    }

    /**
     *     params as body
     */
    if (
      (hasTransformType(TransformType.BodyTop) ||
        hasTransformType(TransformType.BodyBottom)) &&
      _.isObject(body) &&
      !_.isArray(body)
    ) {
      _(params).forEach((value, key) => {
        if (
          hasTransformType(TransformType.BodyBottom) &&
          !_.isUndefined(body[key])
        ) {
          return;
        }
        body[key] = value;
      });
    }

    return next.handle();
  }
}
