import {
  MAPS_COORDS_TO_ADDRESS_PATH,
  MAPS_LINK_TO_COORDS_PATH,
} from '~/constants/google-maps-n8n-api';
import type {
  MapsCoordsToAddressResponse,
  MapsLinkToCoordsResponse,
} from '~/interfaces/maps/geocoding';

export type MapsGeocodingFetch = <T = unknown>(
  url: string,
  options?: Record<string, unknown>,
) => Promise<T>;

export function isValidGeocodingCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValidGeocodingLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function parseGeocodingCoordinateString(
  value: string | null | undefined,
): number | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function readGeocodingLatLng(
  latitude: string | null | undefined,
  longitude: string | null | undefined,
): { lat: number; lng: number } | null {
  const lat = parseGeocodingCoordinateString(latitude);
  const lng = parseGeocodingCoordinateString(longitude);
  if (lat == null || lng == null) return null;
  if (!isValidGeocodingLatLng(lat, lng)) return null;
  return { lat, lng };
}

export async function fetchAddressFromCoords(
  apiFetch: MapsGeocodingFetch,
  lat: number,
  lng: number,
  options?: { signal?: AbortSignal },
): Promise<MapsCoordsToAddressResponse> {
  return apiFetch<MapsCoordsToAddressResponse>(MAPS_COORDS_TO_ADDRESS_PATH, {
    method: 'POST',
    body: { lat, lng },
    signal: options?.signal,
  });
}

export async function fetchCoordsFromMapsLink(
  apiFetch: MapsGeocodingFetch,
  mapsUrl: string,
  options?: { signal?: AbortSignal },
): Promise<MapsLinkToCoordsResponse> {
  return apiFetch<MapsLinkToCoordsResponse>(MAPS_LINK_TO_COORDS_PATH, {
    method: 'POST',
    body: { maps_url: mapsUrl.trim() },
    signal: options?.signal,
  });
}
