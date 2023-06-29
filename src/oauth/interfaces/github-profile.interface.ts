export interface IGithubProfile {
  id: string;
  displayName: string;
  username: string;
  profileUrl: string;
  photos: Array<{ value: string }>;
}
