import type { OperationalRescueStatus } from '~/constants/operational-kanban';

export interface RescueCardDetail {
  id: number;
  folio: string;
  service_type: string;
  client_id: number;
  client_name: string;
  description: string;
  sale_price: string | null;
  operative_status: OperationalRescueStatus;
  operator_id: number | null;
  operator_name: string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  multiple_managers: boolean;
  sub_total: string | null;
  admin_status: string;
  created_at: string;
  phase_started_at: string;
  client_type: string;
  client_phone: string | null;
  seller_id: number | null;
  seller_name: string | null;
  vehicle: string | null;
  provider_cost: string | null;
  net_profit: string | null;
  supplier_score: number | null;
  latitude: string | null;
  longitude: string | null;
}
