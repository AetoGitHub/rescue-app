import { describe, expect, it } from 'vitest';
import { paymentCheckoutRecipientFromFilters } from '../../app/composables/usePaymentCheckoutRecipient';

describe('usePaymentCheckoutRecipient', () => {
  it('paymentCheckoutRecipientFromFilters maps list filters', () => {
    expect(
      paymentCheckoutRecipientFromFilters(
        {
          type: 'operative',
          userId: 7,
          folio: '',
          fromDate: null,
          toDate: null,
        },
        'Estrella Cruz',
      ),
    ).toEqual({
      type: 'operative',
      userId: 7,
      userName: 'Estrella Cruz',
    });
  });

  it('paymentCheckoutRecipientFromFilters requires userId', () => {
    expect(
      paymentCheckoutRecipientFromFilters({
        type: 'seller',
        userId: null,
        folio: '',
        fromDate: null,
        toDate: null,
      }),
    ).toBeNull();
  });
});
