import { Prisma } from '@prisma/client';

export const roomMemberSelect = Prisma.validator<Prisma.RoomMemberSelect>()({
  id: true,
  nickName: true,
  role: true,
  member: {
    select: {
      id: true,
      username: true,
      displayName: true,
      photoUrl: true,
    },
  },
  createdAt: true,
});

export const roomSelect = Prisma.validator<Prisma.RoomSelect>()({
  id: true,
  name: true,
  isGroup: true,
  photoUrl: true,
  coverUrl: true,
  themeSource: true,
  themeStyle: true,
  lastActivatedAt: true,
  createdAt: true,
  roomMembers: {
    select: roomMemberSelect,
  },
  roomMessages: {
    select: {
      id: true,
      type: true,
      content: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          photoUrl: true,
        },
      },
      createdAt: true,
    },
    take: 1,
    orderBy: { createdAt: 'desc' },
  },
});

export const roomMessageSelect = Prisma.validator<Prisma.RoomMessageSelect>()({
  id: true,
  type: true,
  content: true,
  room: {
    select: roomSelect,
  },
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      photoUrl: true,
    },
  },
  createdAt: true,
});

export const roomAdvancedSelect = Prisma.validator<Prisma.RoomSelect>()({
  id: true,
  name: true,
  isGroup: true,
  photoUrl: true,
  lastActivatedAt: true,
  createdAt: true,
  roomMembers: {
    select: roomMemberSelect,
  },
  roomMessages: {
    select: {
      id: true,
      type: true,
      content: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          photoUrl: true,
        },
      },
      createdAt: true,
    },
    take: 1,
    orderBy: { createdAt: 'desc' },
  },
});
