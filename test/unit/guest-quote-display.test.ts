import { describe, expect, it } from 'vitest';
import { guestQuoteDisplayUnitPrice } from '~/utils/guest-quote-display';

describe('guestQuoteDisplayUnitPrice', () => {
  it('divide total de línea entre cantidad (2 remolques: 4000/2 = 2000)', () => {
    expect(guestQuoteDisplayUnitPrice('4000', 2)).toBe('$2,000');
  });

  it('divide total de línea entre cantidad (10 items: 5000/10 = 500)', () => {
    expect(guestQuoteDisplayUnitPrice('5000', 10)).toBe('$500');
  });

  it('returns zero when quantity is invalid', () => {
    expect(guestQuoteDisplayUnitPrice('5000', 0)).toBe('$0');
    expect(guestQuoteDisplayUnitPrice('5000', -1)).toBe('$0');
  });
});
