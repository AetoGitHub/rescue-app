export const OPERATIVE_BALANCE_PATH = '/api/payment/balance/operative/';
export const SELLER_BALANCE_PATH = '/api/payment/balance/seller/';

export type BalanceProfile = 'operative' | 'seller';

export function resolveBalanceProfile(
  role: string | null | undefined,
): BalanceProfile | null {
  if (role === 'operator') return 'operative';
  if (role === 'seller') return 'seller';
  return null;
}
