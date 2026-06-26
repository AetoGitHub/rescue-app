export type SupplierServiceType =
  | 'cranes'
  | 'mechanics'
  | 'road_assist'
  | 'forklifts'
  | 'flatbed'
  | 'transport'
  | 'other';

export interface Supplier {
  id: number;
  name: string;
  service_type: SupplierServiceType[];
  phone: string;
  is_trusted: boolean;
  is_active: boolean;
  score?: number;
  rescues_count?: number;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export interface SupplierListItem {
  id: number;
  name: string;
  service_type: SupplierServiceType[];
  phone: string;
  is_trusted: boolean;
  is_active: boolean;
  score: number;
  rescues_count: number;
  distance_km?: number | null;
  distance?: number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export interface SupplierListResponse {
  count?: number;
  results: SupplierListItem[];
  next?: string | null;
  previous?: string | null;
}

/** POST /api/supplier/{id}/review/create/ */
export interface SupplierReviewCreateBody {
  rating: number;
  comment?: string;
  rescue_id?: number;
}

export interface SupplierCreateBody {
  name: string;
  description: string;
  phone: string;
  email: string;
  service_type: SupplierServiceType[];
  is_trusted: boolean;
  notes: string;
  latitude: string;
  longitude: string;
}
