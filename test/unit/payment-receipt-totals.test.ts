import { describe, expect, it } from 'vitest';
import type { PaymentDebtItem } from '../../app/interfaces/payment/debt';
import type { PaymentReceiptOperativeItem } from '../../app/interfaces/payment/receipt';
import {
  computeReceiptCommissionSubtotal,
  computeReceiptDebtSubtotal,
  computeReceiptOperativeLineAmount,
} from '../../app/utils/payment-receipt-totals';

function operativeItem(
  overrides: Partial<PaymentReceiptOperativeItem> = {},
): PaymentReceiptOperativeItem {
  return {
    id: 1,
    rescue_folio: 'RES-001',
    operator_id: 2,
    operator_name: 'Operador',
    operator_commission: '20.00',
    amount: '270.00',
    is_penalty: false,
    penalty_applied: '0.00',
    penalty_amount: '0.00',
    penalty_forgiven: false,
    date_payment: '2026-06-22T22:09:36Z',
    ...overrides,
  };
}

function debtItem(overrides: Partial<PaymentDebtItem> = {}): PaymentDebtItem {
  return {
    id: 10,
    rescue_folio: null,
    user_id: 2,
    user_name: 'Operador',
    amount: '100.00',
    payment: true,
    source: 'cancelled',
    comment: null,
    created_at: '2026-06-22T21:58:47Z',
    ...overrides,
  };
}

describe('payment-receipt-totals', () => {
  it('computeReceiptOperativeLineAmount uses penalty_amount unless forgiven', () => {
    const item = operativeItem({
      is_penalty: true,
      amount: '270.00',
      penalty_amount: '200.00',
      penalty_forgiven: false,
    });

    expect(computeReceiptOperativeLineAmount(item)).toBe(200);
    expect(
      computeReceiptOperativeLineAmount({
        ...item,
        penalty_forgiven: true,
      }),
    ).toBe(270);
  });

  it('computeReceiptCommissionSubtotal sums operative and seller lines', () => {
    const total = computeReceiptCommissionSubtotal(
      [operativeItem({ amount: '100.00' })],
      [
        {
          id: 2,
          rescue_folio: 'RES-002',
          amount: '50.00',
          date_payment: '2026-06-22T22:09:36Z',
        },
      ],
    );

    expect(total).toBe(150);
  });

  it('computeReceiptDebtSubtotal sums debt amounts', () => {
    expect(
      computeReceiptDebtSubtotal([
        debtItem({ amount: '100.00' }),
        debtItem({ id: 11, amount: '25.50' }),
      ]),
    ).toBe(125.5);
  });
});
