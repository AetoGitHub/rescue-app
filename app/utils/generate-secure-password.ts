const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*-_+=?';

const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;

function randomIndex(max: number, randomValues: Uint32Array, cursor: { i: number }): number {
  return randomValues[cursor.i++ % randomValues.length]! % max;
}

function pickChar(pool: string, randomValues: Uint32Array, cursor: { i: number }): string {
  return pool[randomIndex(pool.length, randomValues, cursor)]!;
}

export function generateSecurePassword(length = 16): string {
  const size = Math.max(8, length);
  const randomValues = new Uint32Array(size * 2);
  crypto.getRandomValues(randomValues);
  const cursor = { i: 0 };

  const required = [
    pickChar(UPPERCASE, randomValues, cursor),
    pickChar(LOWERCASE, randomValues, cursor),
    pickChar(DIGITS, randomValues, cursor),
    pickChar(SYMBOLS, randomValues, cursor),
  ];

  const chars = [...required];
  while (chars.length < size) {
    chars.push(pickChar(ALL_CHARS, randomValues, cursor));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1, randomValues, cursor);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join('');
}
