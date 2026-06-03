import type { ClientType } from '~/interfaces/catalogs/client';

type BadgeColor = 'success' | 'info' | 'neutral' | 'warning' | 'error' | 'primary';

export function clientTypeBadgeProps(
  type: string | null | undefined,
): { label: string; color: BadgeColor; variant: 'subtle' } {
  switch (type) {
    case 'CREDIT':
      return { label: 'Crédito', color: 'success', variant: 'subtle' };
    case 'CASH':
      return { label: 'Contado', color: 'info', variant: 'subtle' };
    case 'PUBLIC':
      return { label: 'Público general', color: 'neutral', variant: 'subtle' };
    default:
      return { label: String(type ?? '—'), color: 'neutral', variant: 'subtle' };
  }
}

export function parseClientMoney(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatClientMoney(value: string | number | null | undefined): string {
  const amount = parseClientMoney(value);
  if (amount == null) return '—';
  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function clientCreditUsagePercent(
  used: string | number | null | undefined,
  limit: string | number | null | undefined,
): number | null {
  const usedAmount = parseClientMoney(used);
  const limitAmount = parseClientMoney(limit);
  if (usedAmount == null) return null;
  if (limitAmount == null || limitAmount <= 0) {
    return usedAmount > 0 ? 100 : null;
  }
  return Math.min(100, Math.round((usedAmount / limitAmount) * 100));
}

export function isCreditClientType(type: string | null | undefined): boolean {
  return type === 'CREDIT';
}

export type ClientListTypeFilter = 'all' | ClientType;

export function matchesClientTypeFilter(
  clientType: string,
  filter: ClientListTypeFilter,
): boolean {
  if (filter === 'all') return true;
  return clientType === filter;
}
