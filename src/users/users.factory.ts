import { Prisma } from '@prisma/client';

export const userAdvancedSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  displayName: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
  coverUrl: true,
  themeSource: true,
  themeStyle: true,
  createdAt: true,
  updatedAt: true,
});

export const userProfileSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  displayName: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  location: true,
  salary: true,
  biography: true,
  websiteLink: true,
  photoUrl: true,
  coverUrl: true,
  themeSource: true,
  themeStyle: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      followers: true,
      followees: true,
    },
  },
});

export const userSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  displayName: true,
  email: true,
  emailConfirmed: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  location: true,
  salary: true,
  biography: true,
  websiteLink: true,
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

export const userDetailSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  displayName: true,
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
