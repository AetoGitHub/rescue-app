export const OPERATIVE_BALANCE_PATH = '/api/payment/balance/operative/';
export const SELLER_BALANCE_PATH = '/api/payment/balance/seller/';
export const PAYMENT_OPERATIVE_LIST_PATH = '/api/payment/operative/';
export const PAYMENT_SELLER_LIST_PATH = '/api/payment/seller/';
export const PAYMENT_CART_PATH = '/api/payment/cart/';
export const PAYMENT_CART_PAY_PATH = '/api/payment/cart/pay/';
export const PAYMENT_DEBT_PATH = '/api/payment/debt/';
export const PAYMENT_DEBT_CREATE_PATH = '/api/payment/debt/create/';

export type BalanceProfile = 'operative' | 'seller';
export type PaymentRecipientType = 'operative' | 'seller';
export type PaymentDebtSource = 'cancelled' | 'warranty' | 'in_moment';

export const PAYMENT_RECIPIENT_TYPE_OPTIONS: {
  label: string;
  value: PaymentRecipientType;
}[] = [
  { label: 'Operadores', value: 'operative' },
  { label: 'Vendedores', value: 'seller' },
];

export const PAYMENT_DEBT_SOURCE_OPTIONS: {
  label: string;
  value: PaymentDebtSource;
}[] = [
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Garantía', value: 'warranty' },
  { label: 'En el momento', value: 'in_moment' },
];

export function resolveBalanceProfile(
  role: string | null | undefined,
): BalanceProfile | null {
  if (role === 'operator') return 'operative';
  if (role === 'seller') return 'seller';
  return null;
}
