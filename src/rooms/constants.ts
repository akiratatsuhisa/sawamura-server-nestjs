export const NAME = 'rooms';

export const SOCKET_ROOM_EVENTS = {
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
  TYPING_ROOM: 'typing:room',

  LIST_ROOM: 'list:room',
  READ_ROOM: 'read:room',
  CREATE_ROOM: 'create:room',
  UPDATE_ROOM: 'update:room',
  UPDATE_ROOM_PHOTO: 'update:room:photo',
  UPDATE_ROOM_COVER: 'update:room:cover',
  UPDATE_ROOM_THEME: 'update:room:theme',
  DELETE_ROOM: 'delete:room',

  CREATE_MEMBER: 'create:member',
  UPDATE_MEMBER: 'update:member',
  DELETE_MEMBER: 'delete:member',

  LIST_MESSAGE: 'list:message',
  CREATE_MESSAGE: 'create:message',
  UPDATE_MESSAGE: 'update:message',
  DELETE_MESSAGE: 'delete:message',
};

export const QUEUE_ROOM_EVENTS = {
  UPDATE_ROOM_IMAGE: 'update:room:photo',
  DELETE_ROOM_IMAGE: 'delete:room:photo',
  UPDATE_ROOM_THEME: 'update:room:theme',
};
