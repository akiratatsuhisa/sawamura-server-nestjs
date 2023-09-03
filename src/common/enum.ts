import _ from 'lodash';

export enum EmailState {
  None = 'none',
  Unverified = 'unverified',
  Verified = 'verified',
}

export enum SearchMatch {
  All = 'all',
  Any = 'any',
}

export enum SearchFilter {
  Not = 'NOT',
  Or = 'OR',
  And = 'AND',
}

export enum RelationFilter {
  Is = 'is',
  IsNot = 'isNot',
}

export enum ListRelationFilter {
  Every = 'every',
  Some = 'some',
}

export function makeHasState<T extends string>(values: Array<T>) {
  return (value: T) => _.some(values, (v) => v === value);
}
