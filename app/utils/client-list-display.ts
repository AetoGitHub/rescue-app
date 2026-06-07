import type { ClientType } from '~/interfaces/catalogs/client';
import type { ClientCreditSnapshot } from '~/schemas/rescue-create';

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

export function normalizeClientType(raw: unknown): string {
  if (raw == null || raw === '') return 'CASH';
  if (typeof raw === 'string') return raw.trim().toUpperCase();
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    const value = (raw as { value: unknown }).value;
    return typeof value === 'string' ? value.trim().toUpperCase() : 'CASH';
  }
  return String(raw).trim().toUpperCase();
}

export function isCreditClientType(type: string | null | undefined): boolean {
  if (type == null || type === '') return false;
  return type.trim().toUpperCase() === 'CREDIT';
}

export function isWizardCreditClient(snapshot: ClientCreditSnapshot): boolean {
  if (isCreditClientType(snapshot.client_type)) return true;
  if (snapshot.credit_available != null) return true;
  const limit = parseClientMoney(snapshot.credit_limit);
  return limit != null && limit > 0;
}

export function shouldShowWizardCreditCard(
  clientId: number | undefined | null,
  snapshot: ClientCreditSnapshot | null | undefined,
): boolean {
  if (clientId == null) return false;
  if (snapshot == null) return true;
  return isWizardCreditClient(snapshot);
}

export type ClientListTypeFilter = 'all' | ClientType;

export function matchesClientTypeFilter(
  clientType: string,
  filter: ClientListTypeFilter,
): boolean {
  if (filter === 'all') return true;
  return clientType === filter;
}
