import { describe, expect, it } from 'vitest';
import type { OperativeBalanceVoucher } from '../../app/interfaces/payment/balance-operative';
import type { SellerBalanceVoucher } from '../../app/interfaces/payment/balance-seller';
import type { PaymentDebtItem } from '../../app/interfaces/payment/debt';
import {
  computeBalanceCommissionSubtotal,
  computeBalanceDebtSubtotal,
  computeBalanceGrandTotal,
  computeBalanceVoucherLineAmount,
} from '../../app/utils/payment-balance-totals';

function operativeVoucher(
  overrides: Partial<OperativeBalanceVoucher> = {},
): OperativeBalanceVoucher {
  return {
    id: 1,
    rescue_folio: 'RES-001',
    rescue_operative_status: 'approved',
    rescue_admin_status: 'pending',
    operator_name: 'Juan',
    operator_commission: '10',
    amount: '270.00',
    is_penalty: false,
    penalty_applied: '0',
    penalty_amount: '0',
    created_at: '2026-06-19T20:54:26Z',
    ...overrides,
  };
}

function sellerVoucher(
  overrides: Partial<SellerBalanceVoucher> = {},
): SellerBalanceVoucher {
  return {
    id: 2,
    rescue_folio: 'RES-002',
    rescue_operative_status: 'approved',
    rescue_admin_status: 'pending',
    operator_name: 'Ana',
    operator_commission: '5',
    amount: '150.00',
    created_at: '2026-06-19T20:54:26Z',
    ...overrides,
  };
}

function debtItem(overrides: Partial<PaymentDebtItem> = {}): PaymentDebtItem {
  return {
    id: 10,
    rescue_folio: 'RES-010',
    user_id: 2,
    user_name: 'Juan',
    amount: '100.00',
    payment: false,
    source: 'cancelled',
    comment: null,
    created_at: '2026-06-15T08:30:00Z',
    ...overrides,
  };
}

describe('payment-balance-totals', () => {
  it('computeBalanceVoucherLineAmount uses penalty_amount for operative penalties', () => {
    const voucher = operativeVoucher({
      is_penalty: true,
      amount: '270.00',
      penalty_amount: '200.00',
    });

    expect(computeBalanceVoucherLineAmount(voucher, 'operative')).toBe(200);
  });

  it('computeBalanceVoucherLineAmount uses amount for seller vouchers', () => {
    expect(computeBalanceVoucherLineAmount(sellerVoucher(), 'seller')).toBe(150);
  });

  it('computeBalanceCommissionSubtotal sums operative vouchers with penalties', () => {
    const subtotal = computeBalanceCommissionSubtotal(
      [
        operativeVoucher({ id: 1, amount: '100.00' }),
        operativeVoucher({
          id: 2,
          is_penalty: true,
          amount: '270.00',
          penalty_amount: '200.00',
        }),
      ],
      'operative',
    );

    expect(subtotal).toBe(300);
  });

  it('computeBalanceDebtSubtotal sums debt amounts', () => {
    expect(
      computeBalanceDebtSubtotal([
        debtItem({ amount: '100.00' }),
        debtItem({ id: 11, amount: '25.50' }),
      ]),
    ).toBe(125.5);
  });

  it('computeBalanceGrandTotal subtracts debts from commission subtotal', () => {
    const total = computeBalanceGrandTotal(
      [operativeVoucher({ amount: '300.00' })],
      [debtItem({ amount: '100.00' })],
      'operative',
    );

    expect(total).toBe(200);
  });
});
