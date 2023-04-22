export const SOCKET_DASHBOARD_EVENTS = {
  READ_STORAGE_DROPBOX: 'read:storage:dropbox',
  READ_STORAGE_CACHE: 'read:storage:cahe',

  READ_COUNT_USERS: 'read:count:users',
  LIST_ROLE: 'list:role',

  CHART_MESSAGES: 'chart:messages',

  CHART_USER_ROLES: 'chart:userRoles',
};

export const REDIS_DASHBOARD_KEYS = {
  STORAGE_DROPBOX: 'dashboard:storage:dropbox',
  STORAGE_DROPBOX_CACHE_SECONDS: 300, // 5 minutes
  STORAGE_CACHE: 'dashboard:storage:cache',
};
