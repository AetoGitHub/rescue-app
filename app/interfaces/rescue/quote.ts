import type { RescueCommissionType } from '~/interfaces/rescue/company-settings';

export interface RescueQuoteServiceCreateBody {
  service: number;
  quantity: number;
  real_cost: string;
  pre_total: string;
  percenaje_apply?: string;
  amount_applied?: string;
  amount_rounded?: string;
  total: string;
}

export interface RescueQuoteCreateBody {
  rescue: number;
  technical_cost: string;
  sub_total: string;
  /** Precio a aplicar (before IVA), always sent. */
  applied_price: string;
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
  percenaje_apply: string;
  amount_applied: string;
  amount_rounded: string;
  total: string;
}

export interface RescueQuoteDetail {
  id: number;
  rescue_id: number;
  technical_cost: string;
  sub_total: string;
  applied_price?: string | null;
  total: string;
  comissions_apply: string;
  iva: number;
  services: RescueQuoteServiceDetail[];
}
