import { describe, expect, it } from 'vitest';
import { getRescuePaymentMethodLabel } from '~/utils/administrative-rescue-display';

describe('getRescuePaymentMethodLabel', () => {
  it('returns catalog label for known method value', () => {
    expect(getRescuePaymentMethodLabel('card')).toBe('Tarjeta');
    expect(getRescuePaymentMethodLabel('transfer')).toBe('Transferencia');
  });

  it('returns raw value when not in catalog', () => {
    expect(getRescuePaymentMethodLabel('tarjeta')).toBe('tarjeta');
  });

  it('returns em dash for empty values', () => {
    expect(getRescuePaymentMethodLabel(null)).toBe('—');
    expect(getRescuePaymentMethodLabel('  ')).toBe('—');
  });
});
