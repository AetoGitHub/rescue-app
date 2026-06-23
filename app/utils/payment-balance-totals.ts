import type { BalanceProfile } from '~/constants/payment-api';
import type { BalanceVoucher } from '~/interfaces/payment/balance';
import { isOperativeBalanceVoucher } from '~/interfaces/payment/balance';
import type { PaymentDebtItem } from '~/interfaces/payment/debt';
import { computeCheckoutCartLineAmount } from '~/utils/payment-checkout-totals';
import { parseRescueCardMoney } from '~/utils/operational-rescue-card';

export function computeBalanceVoucherLineAmount(
  voucher: BalanceVoucher,
  profile: BalanceProfile,
): number {
  if (profile === 'operative' && isOperativeBalanceVoucher(voucher, profile)) {
    return computeCheckoutCartLineAmount(voucher, false);
  }

  return parseRescueCardMoney(voucher.amount);
}

export function computeBalanceCommissionSubtotal(
  vouchers: BalanceVoucher[],
  profile: BalanceProfile,
): number {
  return vouchers.reduce(
    (sum, voucher) => sum + computeBalanceVoucherLineAmount(voucher, profile),
    0,
  );
}

export function computeBalanceDebtSubtotal(debts: PaymentDebtItem[]): number {
  return debts.reduce(
    (sum, debt) => sum + parseRescueCardMoney(debt.amount),
    0,
  );
}

export function computeBalanceGrandTotal(
  vouchers: BalanceVoucher[],
  debts: PaymentDebtItem[],
  profile: BalanceProfile,
): number {
  return (
    computeBalanceCommissionSubtotal(vouchers, profile)
    - computeBalanceDebtSubtotal(debts)
  );
}
