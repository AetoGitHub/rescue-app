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
}

export interface RescueQuoteLinePayload {
  service_id: number;
  service_label: string;
  quantity: number;
  unit_cost: number;
  cost_subtotal: number;
  line_total: number;
}

export interface RescueCreateBody {
  service_type: RescueServiceType;
  client: number;
  general_public: boolean;
  serial_number?: string;
  service_description: string;
  supplier: number | null;
  manager?: number | null;
  location_latitude: string;
  location_longitude: string;
  location_description: string;
  internal_notes: string;
  /** Prepared for backend; may be ignored by API until supported. */
  quote_lines?: RescueQuoteLinePayload[];
}

export interface RescueCreateResponse {
  id: number;
  folio: string;
}
