import { parseRescueCardMoney } from '~/utils/operational-rescue-card';

export function formatCommissionPercent(
  value: string | null | undefined,
): string {
  const parsed = parseRescueCardMoney(value);
  if (parsed === 0) return '0%';
  return `${parsed % 1 === 0 ? parsed.toFixed(0) : parsed.toFixed(2).replace(/\.?0+$/, '')}%`;
}

export function paymentListCommissionRate(
  row: {
    operator_commission?: string;
    seller_commission?: string;
  },
  type: 'operative' | 'seller',
): string {
  const value =
    type === 'seller'
      ? row.seller_commission ?? row.operator_commission
      : row.operator_commission ?? row.seller_commission;
  return formatCommissionPercent(value);
}
