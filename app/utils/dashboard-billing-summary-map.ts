import type {
  DashboardBillingSummary,
  DashboardBillingSummaryApi,
} from '~/interfaces/invoicing/dashboard-summary';
import type { AdministrativeRescueCardsSummary } from '~/interfaces/rescue/cards-summary';

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asRecord(raw: unknown): DashboardBillingSummaryApi {
  if (raw != null && typeof raw === 'object') {
    return raw as DashboardBillingSummaryApi;
  }
  return {};
}

export const EMPTY_DASHBOARD_BILLING_SUMMARY: DashboardBillingSummary = {
  count: 0,
  total: 0,
  sub_total: 0,
  net_profit: 0,
};

/** Maps administrativo / pending-invoice / pending-charge summary payloads. */
export function mapDashboardBillingSummary(
  raw: unknown,
): DashboardBillingSummary {
  const record = asRecord(raw);
  return {
    count: Math.max(0, Math.trunc(toNumber(record.count))),
    total: toNumber(record.total),
    sub_total: toNumber(record.sub_total ?? record.subtotal),
    net_profit: toNumber(record.net_profit),
  };
}

export function mapAdministrativeCardsSummary(
  raw: unknown,
): AdministrativeRescueCardsSummary {
  const summary = mapDashboardBillingSummary(raw);
  return {
    ...summary,
    subtotal: summary.sub_total,
  };
}
