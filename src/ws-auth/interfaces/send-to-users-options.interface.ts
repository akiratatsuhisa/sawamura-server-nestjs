export interface ISendToUsersOptions<D = unknown> {
  event: string;
  userIds: string | Array<string>;
  data: D;
  unconnectedCallback?: (
    unconnectedUserIds: Array<string>,
    data: D,
  ) => void | Promise<void>;
}
