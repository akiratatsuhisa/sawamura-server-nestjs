import { Prisma } from '@prisma/client';

export const notificationSelect = Prisma.validator<Prisma.NotificationSelect>()(
  {
    id: true,
    entity: true,
    referenceId: true,
    sourceUser: {
      select: {
        id: true,
        username: true,
        photoUrl: true,
      },
    },
    targetUser: {
      select: {
        id: true,
        username: true,
        photoUrl: true,
      },
    },
    code: true,
    params: true,
    status: true,
    viewedAt: true,
    readAt: true,
    createdAt: true,
    updatedAt: true,
  },
);
