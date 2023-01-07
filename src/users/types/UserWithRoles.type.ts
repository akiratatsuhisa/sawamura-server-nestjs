import { Role, User, UserRole } from '@prisma/client';

export type UserWithRoles = User & {
  userRoles: Array<UserRole & { role: Role }>;
};
