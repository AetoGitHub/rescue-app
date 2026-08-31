export interface OperationalRescueCardsSummary {
  total: number;
  subtotal: number;
}

export interface AdministrativeRescueCardsSummary {
  count: number;
  total: number;
  /** Alias of `sub_total` after mapping. */
  subtotal: number;
  sub_total: number;
  net_profit: number;
}
