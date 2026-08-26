import type { RescueCommissionType } from '~/interfaces/rescue/company-settings';

export type QuotePriceOverrideSource = 'none' | 'client_price' | 'applied_price';

export interface QuoteBlameField {
  original: string;
  user_id: number;
  username: string;
}

export interface QuoteLineBlameDataRaw {
  client_price?: QuoteBlameField;
  applied_price?: QuoteBlameField;
}

export interface RescueQuoteServiceCreateBody {
  service: number;
  quantity: number;
  real_cost: string;
  pre_total: string;
  /** Precio a aplicar for this line (before IVA / after money round). */
  applied_price: string;
  /** Venta AETO unitario (initializer = unit_cost × multiplier, or user override). */
  client_price: string;
  percenaje_apply?: string;
  amount_applied?: string;
  amount_rounded?: string;
  total: string;
  /** Per quote line. `{}` when the user did not explicitly override venta AETO or applied total. */
  blame_data_raw: QuoteLineBlameDataRaw;
}

export interface RescueQuoteCreateBody {
  rescue: number;
  technical_cost: string;
  sub_total: string;
  total: string;
  seller_commission_type: RescueCommissionType;
  seller_commission_value: string;
  seller_commission_fixed: string;
  seller_commission_amount: string;
  comissions_apply?: string;
  /** IVA percent: 8 or 16 */
  iva?: number;
  services: RescueQuoteServiceCreateBody[];
}

export type RescueQuoteUpdateBody = Omit<RescueQuoteCreateBody, 'rescue'>;

export interface RescueQuoteCreateResponse {
  id: number;
}

export interface RescueQuoteServiceDetail {
  id: number;
  service_id: number;
  service_name: string;
  quantity: number;
  real_cost: string;
  pre_total: string;
  applied_price?: string | null;
  client_price?: string | null;
  percenaje_apply: string;
  amount_applied: string;
  amount_rounded: string;
  total: string;
  blame_data_raw?: QuoteLineBlameDataRaw | null;
}

export interface RescueQuoteDetail {
  id: number;
  rescue_id: number;
  technical_cost: string;
  sub_total: string;
  /** @deprecated Quote-level override; prefer per-service applied_price. */
  applied_price?: string | null;
  total: string;
  comissions_apply: string;
  iva: number;
  services: RescueQuoteServiceDetail[];
}
