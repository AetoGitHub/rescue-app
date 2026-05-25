export type {
  RescueCard,
  RescueCardApproved,
  RescueCardBase,
  RescueCardClosed,
  RescueCardInProgress,
  RescueCardWaitingAdvance,
} from './card';

export type RescueServiceType =
  | 'rescue'
  | 'loan'
  | 'proyect'
  | 'direct_budget';

export type RescueSupplierSort = 'distance' | 'ranking' | 'name';

export interface RescueSupplierNearbyRow {
  id: number;
  name: string;
  phone: string;
  is_trusted: boolean;
  score: number;
  rescues_count: number;
  /** Alias of score for templates */
  ranking: number;
  distance_km: number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export interface SupplierMapPin {
  lat: number;
  lng: number;
  name: string;
}

export interface RescueQuoteLine {
  id: string;
  service_id: number | null;
  service_label: string;
  quantity: number;
  unit_cost: number;
  /** Set when the line uses a contract/convenio item variant. */
  contract_item_id: number | null;
}

export interface RescueCreateBody {
  service_type: RescueServiceType;
  client: number;
  general_public: boolean;
  serial_number?: string;
  service_description: string;
  supplier: number | null;
  operator?: number | null;
  location_latitude: string;
  location_longitude: string;
  location_description: string;
  internal_notes: string;
}

export interface RescueCreateResponse {
  id: number;
  folio: string;
}
