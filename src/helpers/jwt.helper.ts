import { Regex } from '@akiratatsuhisa/sawamura-utils';
import _ from 'lodash';

type ParseType = 'string' | 'number' | 'boolean' | 'object';

export namespace Jwt {
  export function parseData(data: any, type?: ParseType) {
    switch (type) {
      case 'object': {
        if (data instanceof Object) {
          return data;
        }
        return null;
      }
      case 'boolean': {
        if (data instanceof Boolean) {
          return data;
        }
        if (Regex.CommonType.BOOLEAN_POSITIVE.test(data)) {
          return true;
        }
        if (Regex.CommonType.BOOLEAN_NEGATIVE.test(data)) {
          return false;
        }
        return null;
      }
      case 'number': {
        if (data instanceof Number) {
          return data;
        }
        if (Regex.CommonType.DOUBLE.test(data)) {
          return Number(data);
        }
        return null;
      }
      case 'string':
      default:
        return String(data);
    }
  }

  export function get(
    payload: Record<string, any>,
    name: string,
    type?: ParseType,
  ) {
    const data =
      payload[name] instanceof Array ? _.first(payload[name]) : payload[name];

    if (_.isNil(data)) {
      return null;
    }

    return parseData(data, type);
  }

  export function getAll(
    payload: Record<string, any>,
    name: string,
    type?: ParseType,
  ) {
    const data =
      payload[name] instanceof Array ? payload[name] : [payload[name]];

    if (_.isNil(data)) {
      return null;
    }

    return _.map(data, (value) => parseData(value, type));
  }
}
