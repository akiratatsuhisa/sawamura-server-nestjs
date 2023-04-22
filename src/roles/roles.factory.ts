import { Prisma } from '@prisma/client';

export const roleSelect = Prisma.validator<Prisma.RoleSelect>()({
  id: true,
  name: true,
  sort: true,
  default: true,
  createdAt: true,
  updatedAt: true,
});
