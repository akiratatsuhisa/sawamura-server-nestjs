import { Prisma } from '@prisma/client';

export const roomMemberSelect = Prisma.validator<Prisma.RoomMemberSelect>()({
  id: true,
  nickName: true,
  role: true,
  member: {
    select: {
      id: true,
      username: true,
      photoUrl: true,
    },
  },
  createdAt: true,
});

export const roomSelect = Prisma.validator<Prisma.RoomSelect>()({
  id: true,
  name: true,
  isGroup: true,
  roomMembers: {
    select: roomMemberSelect,
  },
  photoUrl: true,
  lastActivatedAt: true,
  createdAt: true,
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
      photoUrl: true,
    },
  },
  createdAt: true,
});
