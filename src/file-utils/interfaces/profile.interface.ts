export interface IProfileContext {
  exportDate: string;
  id: string;
  username: string;
  email: string | null;
  emailConfirmed: boolean;
  photoSrc: string | null;
  userRoles: Array<{
    role: {
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  coverSrc: string | null;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  salary: string | null;
  supportUrl: string;
  supportEmail: string;
}
