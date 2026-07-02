import { describe, expect, it } from 'vitest';
import { parseServiceAlegraId } from '../../app/utils/catalog-detail-map';

describe('parseServiceAlegraId', () => {
  it('reads alegra_id from detail payload', () => {
    expect(parseServiceAlegraId({ alegra_id: 42 })).toBe(42);
    expect(parseServiceAlegraId({ alegra_id: '15' })).toBe(15);
    expect(parseServiceAlegraId({ alegraId: 8 })).toBe(8);
  });

  it('reads nested alegra.id', () => {
    expect(parseServiceAlegraId({ alegra: { id: 7 } })).toBe(7);
    expect(parseServiceAlegraId({ alegra: { id: '11' } })).toBe(11);
  });

  it('returns null when missing or invalid', () => {
    expect(parseServiceAlegraId({})).toBeNull();
    expect(parseServiceAlegraId({ alegra_id: null })).toBeNull();
    expect(parseServiceAlegraId({ alegra_id: 0 })).toBeNull();
    expect(parseServiceAlegraId({ alegra_id: 'abc' })).toBeNull();
    expect(parseServiceAlegraId({ alegra: { name: 'x' } })).toBeNull();
  });
});
