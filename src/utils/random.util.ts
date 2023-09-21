import { randomBytes } from 'crypto';

export namespace Random {
  const WORDS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';

  export function generateWords(
    length: number,
    includeUnderscore: boolean = true,
  ) {
    const array = includeUnderscore ? WORDS : WORDS.slice(0, 62);

    return Array.from(
      { length },
      () => array[Math.floor(Math.random() * array.length)],
    ).join('');
  }

  export function generateSecurityStamp() {
    const randomHex = randomBytes(16).toString('hex');

    const date = new Date().getTime().toString().padStart(16, '0');

    return `${date}${randomHex}`.slice(0, 128);
  }
}
