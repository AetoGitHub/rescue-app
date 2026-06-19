import type { OperativeBalanceVoucher } from '~/interfaces/payment/balance-operative';
import type { SellerBalanceVoucher } from '~/interfaces/payment/balance-seller';

export type BalanceVoucher = OperativeBalanceVoucher | SellerBalanceVoucher;

export type BalanceResponse = {
  results: BalanceVoucher[];
  total: string;
};

export function isOperativeBalanceVoucher(
  voucher: BalanceVoucher,
  profile: 'operative' | 'seller' | null | undefined,
): voucher is OperativeBalanceVoucher {
  return profile === 'operative';
}
