export interface CreditCreateBody {
  client: number;
  limit: string;
  days: number;
  extension: number;
  remision_tolerance: number;
  requires_purchase_order: boolean;
  is_blocked: boolean;
}

export type CreditFormState = Omit<CreditCreateBody, 'client'>;
