import { randomBytes } from 'crypto';

export namespace Security {
  export function generateSecurityStamp() {
    const randomHex = randomBytes(16).toString('hex');

    const date = new Date().getTime().toString().padStart(16, '0');

    return `${date}${randomHex}`.slice(0, 128);
  }
}
