import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as _ from 'lodash';
import { Observable } from 'rxjs';

import { DTO_PARSE, TransformType } from './dto-parse.decorator';

@Injectable()
export class DtoParseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = this.reflector.getAllAndOverride<TransformType>(DTO_PARSE, [
      context.getClass(),
      context.getHandler(),
    ]);

    const { body, params, query, method }: Request = context
      .switchToHttp()
      .getRequest();

    // params as query
    if (method === 'GET') {
      _(params).forEach((value, key) => {
        if (
          (type & TransformType.Query) === TransformType.Query &&
          !_.isUndefined(query[key])
        ) {
          return;
        }
        query[key] = value;
      });
    }

    // params as body
    else if (_.isObject(body) && !_.isArray(body)) {
      _(params).forEach((value, key) => {
        if (
          (type & TransformType.Body) === TransformType.Body &&
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
