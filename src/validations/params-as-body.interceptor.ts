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

import { PARAMS_AS_BODY, TransformType } from './params-as-body.decorator';

@Injectable()
export class ParamsAsBodyInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = this.reflector.getAllAndOverride<TransformType>(
      PARAMS_AS_BODY,
      [context.getHandler(), context.getClass()],
    );

    const { body, params }: Request = context.switchToHttp().getRequest();

    if (_.isNil(type) || !_.isObject(body) || _.isArray(body)) {
      return next.handle();
    }

    _(params).forEach((value, key) => {
      if (type === TransformType.Body && !_.isUndefined(body[key])) {
        return;
      }
      body[key] = value;
    });

    return next.handle();
  }
}
