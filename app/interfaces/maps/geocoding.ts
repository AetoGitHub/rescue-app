export interface MapsCoordsToAddressResponse {
  lat: number;
  lng: number;
  address: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  maps_url?: string;
}

export interface MapsLinkToCoordsResponse {
  lat: number;
  lng: number;
  address?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  maps_url?: string;
}

export interface MapsCoordsToAddressBody {
  lat: number;
  lng: number;
}

export interface MapsLinkToCoordsBody {
  maps_url: string;
}

export interface MapPlaceSelectPayload {
  lat: number;
  lng: number;
  address: string;
}
