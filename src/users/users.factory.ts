import { Prisma } from '@prisma/client';

export const userSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
  coverUrl: true,
  themeSource: true,
  themeStyle: true,
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
export const userAdvancedSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  email: true,
  emailConfirmed: true,
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
    orderBy: { role: { sort: 'asc' } },
  },
});

export const userProfileSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  password: true,
  email: true,
  emailConfirmed: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  salary: true,
  photoUrl: true,
  coverUrl: true,
  themeSource: true,
  themeStyle: true,
  createdAt: true,
  updatedAt: true,
  securityStamp: true,
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
