import type {
  PendingInvoiceAttentionFilter,
  PendingInvoiceDetailFilters,
  PendingInvoiceStatusFilter,
} from '~/interfaces/invoicing/pending-invoice-filters';

export function emptyPendingInvoiceDetailFilters(): PendingInvoiceDetailFilters {
  return {
    search: '',
    companyId: null,
    sellerId: null,
    operatorId: null,
    month: null,
    year: null,
    status: null,
    attention: null,
  };
}

function parsePositiveInt(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseStatus(
  value: string | null | undefined,
): PendingInvoiceStatusFilter | null {
  if (value === 'unattended' || value === 'in_remittance') return value;
  return null;
}

function parseAttention(
  value: string | null | undefined,
): PendingInvoiceAttentionFilter | null {
  return value === 'needs_attention' ? value : null;
}

function parseMonth(value: string | null | undefined): number | null {
  const month = parsePositiveInt(value);
  if (month == null || month < 1 || month > 12) return null;
  return month;
}

function parseYear(value: string | null | undefined): number | null {
  const year = parsePositiveInt(value);
  if (year == null || year < 2000 || year > 2100) return null;
  return year;
}

export function buildPendingInvoiceDetailQuery(
  filters: PendingInvoiceDetailFilters,
): Record<string, string> {
  const query: Record<string, string> = {};

  const search = filters.search.trim();
  if (search) {
    query.search = search;
  }

  if (filters.companyId != null) {
    query.company = String(filters.companyId);
  }

  if (filters.sellerId != null) {
    query.seller = String(filters.sellerId);
  }

  if (filters.operatorId != null) {
    query.operator = String(filters.operatorId);
  }

  if (filters.month != null) {
    query.month = String(filters.month);
  }

  if (filters.year != null) {
    query.year = String(filters.year);
  }

  if (filters.status != null) {
    query.status = filters.status;
  }

  if (filters.attention != null) {
    query.attention = filters.attention;
  }

  return query;
}

export function pendingInvoiceDetailFiltersKey(
  filters: PendingInvoiceDetailFilters,
): string[] {
  return [
    filters.search.trim(),
    filters.companyId != null ? String(filters.companyId) : '',
    filters.sellerId != null ? String(filters.sellerId) : '',
    filters.operatorId != null ? String(filters.operatorId) : '',
    filters.month != null ? String(filters.month) : '',
    filters.year != null ? String(filters.year) : '',
    filters.status ?? '',
    filters.attention ?? '',
  ];
}

export function hasActivePendingInvoiceDetailFilters(
  filters: PendingInvoiceDetailFilters,
): boolean {
  return pendingInvoiceDetailFiltersKey(filters).some((part) => part !== '');
}

export function parsePendingInvoiceDetailFiltersFromRoute(
  query: Record<string, string | string[] | undefined | null>,
): PendingInvoiceDetailFilters {
  const read = (key: string): string | null => {
    const value = query[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  return {
    search: read('search')?.trim() ?? '',
    companyId: parsePositiveInt(read('company')),
    sellerId: parsePositiveInt(read('seller')),
    operatorId: parsePositiveInt(read('operator')),
    month: parseMonth(read('month')),
    year: parseYear(read('year')),
    status: parseStatus(read('status')),
    attention: parseAttention(read('attention')),
  };
}

export function pendingInvoiceDetailFiltersToQuery(
  filters: PendingInvoiceDetailFilters,
): Record<string, string> {
  return buildPendingInvoiceDetailQuery(filters);
}

export function parsePendingInvoiceMatrixMonths(
  value: string | null | undefined,
  defaultValue = 6,
): number {
  const parsed = parsePositiveInt(value ?? null);
  if (parsed == null) return defaultValue;
  if (parsed === 3 || parsed === 6 || parsed === 12) return parsed;
  return defaultValue;
}

/** @deprecated use parsePendingInvoiceMatrixMonths */
export const parsePendingInvoiceMatrixMeses = parsePendingInvoiceMatrixMonths;
