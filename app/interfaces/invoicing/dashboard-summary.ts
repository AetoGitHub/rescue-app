/**
 * Shared billing summary from administrativo cards and dashboard list siblings.
 *
 * Backend fields: `count`, `sub_total`, `total`, `net_profit`.
 * `subtotal` is accepted as a legacy alias of `sub_total`.
 */
export interface DashboardBillingSummaryApi {
  count?: number | string | null;
  total?: number | string | null;
  sub_total?: number | string | null;
  subtotal?: number | string | null;
  net_profit?: number | string | null;
}

export interface DashboardBillingSummary {
  count: number;
  total: number;
  sub_total: number;
  net_profit: number;
}
