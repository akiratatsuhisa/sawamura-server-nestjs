export interface ISendToCallerOptions<D extends Record<string, unknown>> {
  dto: unknown;
  event: string;
  data: D;
}

export interface ISendToUsersOptions<D extends Record<string, unknown>>
  extends ISendToCallerOptions<D> {
  userIds: string | Array<string>;
  unconnectedCallback?: (
    unconnectedUserIds: Array<string>,
    data: D,
  ) => void | Promise<void>;
}
