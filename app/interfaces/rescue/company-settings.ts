export type RescueCommissionType = 'PERCENTAGE' | 'FIXED';

export interface RescueCompanyCommissions {
  commission_type: RescueCommissionType;
  commission_value: number;
  commission_fixed: number;
  price_multiplier: number;
  loan_multiplier: number;
}

export interface RescueContractItem {
  id: number;
  service_id: number;
  service_name: string;
  price: number;
  price_multiplier: number;
  percentaje: number;
  notes: string;
}

export interface RescueCompanyContract {
  id: number;
  notes: string;
  items: RescueContractItem[];
}

export interface RescueCompanySettings {
  commissions: RescueCompanyCommissions;
  contract: RescueCompanyContract | null;
}
