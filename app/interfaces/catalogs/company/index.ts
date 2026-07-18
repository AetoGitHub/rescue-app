export interface Company {
  id: number;
  name: string;
  business_name: string;
  rfc: string;
  client_type: string;
  is_active: boolean;
}

export interface CompanyCreateBody {
  name: string;
  business_name: string;
  rfc: string;
  phone: string;
  email: string;
  address: string;
  client_type: string;
  billing_type: string;
  commission_type: string;
  commission_value: string;
  commission_fixed: string;
  price_multiplier: string;
  loan_multiplier: string;
}