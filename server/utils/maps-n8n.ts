import {
  N8N_COORDS_TO_ADDRESS_DEFAULT,
  N8N_LINK_TO_COORDS_DEFAULT,
} from '~/constants/google-maps-n8n-api';

export function resolveN8nCoordsToAddressUrl(): string {
  const config = useRuntimeConfig();
  return config.n8nCoordsToAddressUrl || N8N_COORDS_TO_ADDRESS_DEFAULT;
}

export function resolveN8nLinkToCoordsUrl(): string {
  const config = useRuntimeConfig();
  return config.n8nLinkToCoordsUrl || N8N_LINK_TO_COORDS_DEFAULT;
}

export function parseGeocodingLatLng(
  lat: unknown,
  lng: unknown,
): { lat: number; lng: number } | null {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return null;
  }
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    return null;
  }
  return { lat: parsedLat, lng: parsedLng };
}

export function parseMapsUrlBody(mapsUrl: unknown): string | null {
  if (typeof mapsUrl !== 'string') return null;
  const trimmed = mapsUrl.trim();
  return trimmed.length > 0 ? trimmed : null;
}
