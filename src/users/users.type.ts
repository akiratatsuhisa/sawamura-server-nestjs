import { Prisma } from '@prisma/client';

export const userSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  salary: true,
  photoUrl: true,
  coverUrl: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    select: {
      role: {
        select: {
          name: true,
        },
      },
    },
  },
});
