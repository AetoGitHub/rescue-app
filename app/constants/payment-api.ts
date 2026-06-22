export const OPERATIVE_BALANCE_PATH = '/api/payment/balance/operative/';
export const SELLER_BALANCE_PATH = '/api/payment/balance/seller/';
export const PAYMENT_OPERATIVE_LIST_PATH = '/api/payment/operative/';
export const PAYMENT_SELLER_LIST_PATH = '/api/payment/seller/';
export const PAYMENT_CART_PATH = '/api/payment/cart/';

export type BalanceProfile = 'operative' | 'seller';
export type PaymentRecipientType = 'operative' | 'seller';

export const PAYMENT_RECIPIENT_TYPE_OPTIONS: {
  label: string;
  value: PaymentRecipientType;
}[] = [
  { label: 'Operadores', value: 'operative' },
  { label: 'Vendedores', value: 'seller' },
];

export function resolveBalanceProfile(
  role: string | null | undefined,
): BalanceProfile | null {
  if (role === 'operator') return 'operative';
  if (role === 'seller') return 'seller';
  return null;
}
