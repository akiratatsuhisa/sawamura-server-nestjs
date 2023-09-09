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

export const profileUserSelect = Prisma.validator<Prisma.UserSelect>()({
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
