import { Prisma } from '@prisma/client';

const whinnyCompactSelect = Prisma.validator<Prisma.WhinnySelect>()({
  id: true,
  urlId: true,
  type: true,
  content: true,
  publishDate: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      photoUrl: true,
      coverUrl: true,
      themeSource: true,
      themeStyle: true,
    },
  },
});

export const whinnySelect = Prisma.validator<Prisma.WhinnySelect>()({
  ...whinnyCompactSelect,
  source: {
    select: {
      ...whinnyCompactSelect,
    },
  },
});

export const whinnyReactionSelect =
  Prisma.validator<Prisma.WhinnyReactionSelect>()({
    id: true,
    kind: true,
    icon: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: {
        id: true,
        username: true,
        displayName: true,
        photoUrl: true,
        coverUrl: true,
        themeSource: true,
        themeStyle: true,
      },
    },
  });
