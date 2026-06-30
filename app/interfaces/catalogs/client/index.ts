export type ClientType = 'CASH' | 'CREDIT' | 'PUBLIC';

export interface Client {
  id: number;
  name: string;
  business_name: string;
  rfc: string;
  client_type: ClientType | string;
  company_id: number;
  is_active: boolean;
  phone?: string | null;
  seller_id?: number | null;
  seller_name?: string | null;
  has_contract?: boolean | null;
  credit_limit: string | null;
  credit_used: string | null;
  credit_available: number | null;
}

export interface ClientCreateBody {
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
  company: number | null;
  seller: number;
  notes: string;
  is_active?: boolean;
}

export interface ClientContact {
  id: number;
  client_id: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  whatsapp: string;
  is_authorizer: boolean;
  receives_quotes: boolean;
  receives_oc_reminders: boolean;
  receives_account_status: boolean;
  is_billing_contact: boolean;
  is_active: boolean;
}

export interface ClientContactFormState {
  name: string;
  position: string;
  email: string;
  phone: string;
  whatsapp: string;
  is_authorizer: boolean;
  receives_quotes: boolean;
  receives_oc_reminders: boolean;
  receives_account_status: boolean;
  is_billing_contact: boolean;
  is_active: boolean;
}

export interface ClientContactCreateBody {
  client: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  whatsapp: string;
  is_authorizer: boolean;
  receives_quotes: boolean;
  receives_oc_reminders: boolean;
  receives_account_status: boolean;
  is_billing_contact: boolean;
}

export interface ClientContactUpdateBody {
  client: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  whatsapp: string;
  is_authorizer: boolean;
  receives_quotes: boolean;
  receives_oc_reminders: boolean;
  receives_account_status: boolean;
  is_billing_contact: boolean;
  is_active: boolean;
}

export interface ClientCsfUpdateBody {
  csf: string;
}
