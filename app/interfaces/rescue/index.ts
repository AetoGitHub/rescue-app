export type RescueServiceType =
  | 'rescue'
  | 'loan'
  | 'proyect'
  | 'direct_budget';

export interface RescueCreateBody {
  service_type: RescueServiceType;
  client: number;
  general_public: boolean;
  supplier: null;
  location_latitude: string;
  location_longitude: string;
  location_description: string;
  internal_notes: string;
}

export interface RescueCreateResponse {
  id: number;
  folio: string;
}
