export interface IConfirmEmailContext {
  username: string;
  expires: string;
  confirmationLink: string;
  userEmail: string;
  supportEmail: string;
}
