export const SECURITY_STAMPS_REDIS_KEY = 'securityStamps';

export namespace AUTH_REGEX {
  export const USERNAME = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  export const PASSWORD =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/;
}
