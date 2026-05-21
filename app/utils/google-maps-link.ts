export interface ParsedMapCoordinates {
  lat: number;
  lng: number;
}

function parseCoordinateToken(value: string): number | null {
  const parsed = Number(value.trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Extracts latitude/longitude from common Google Maps share URLs.
 */
export function parseGoogleMapsUrl(url: string): ParsedMapCoordinates | null {
  const trimmed = url.trim();
  if (trimmed === '') return null;

  let candidate = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      candidate = new URL(trimmed).toString();
    }
  } catch {
    return null;
  }

  const atMatch = candidate.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseCoordinateToken(atMatch[1]!);
    const lng = parseCoordinateToken(atMatch[2]!);
    if (lat != null && lng != null && isValidLatLng(lat, lng)) {
      return { lat, lng };
    }
  }

  const dMatch = candidate.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (dMatch) {
    const lat = parseCoordinateToken(dMatch[1]!);
    const lng = parseCoordinateToken(dMatch[2]!);
    if (lat != null && lng != null && isValidLatLng(lat, lng)) {
      return { lat, lng };
    }
  }

  try {
    const parsedUrl = new URL(candidate);
    const q = parsedUrl.searchParams.get('q');
    if (q) {
      const parts = q.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const lat = parseCoordinateToken(parts[0]!);
        const lng = parseCoordinateToken(parts[1]!);
        if (lat != null && lng != null && isValidLatLng(lat, lng)) {
          return { lat, lng };
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export function formatCoordinateString(value: number): string {
  return value.toFixed(6);
}
