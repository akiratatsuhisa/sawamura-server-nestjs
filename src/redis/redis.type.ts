export declare type BucketType =
  | null
  | string
  | number
  | boolean
  | { [key: string]: BucketType }
  | Array<BucketType>;
