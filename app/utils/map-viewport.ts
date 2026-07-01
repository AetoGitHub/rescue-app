import type { SupplierMapListQuery } from '~/interfaces/catalogs/supplier';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  zoom: number;
  bounds: MapBounds;
}

export function getMapViewport(
  map: google.maps.Map | null | undefined,
): MapViewport | null {
  if (!map) return null;

  const zoom = map.getZoom();
  const bounds = map.getBounds();
  if (zoom == null || !bounds) return null;

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  return {
    zoom,
    bounds: {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    },
  };
}

/** Default map center (CDMX) used when rescue unit has no coordinates. */
export const DEFAULT_MAP_CENTER = {
  lat: 19.432608,
  lng: -99.133209,
} as const;

/** Fallback bounds (~±0.45°) around CDMX for supplier search without unit location. */
export const DEFAULT_SUPPLIER_SEARCH_BOUNDS: MapBounds = {
  north: DEFAULT_MAP_CENTER.lat + 0.45,
  south: DEFAULT_MAP_CENTER.lat - 0.45,
  east: DEFAULT_MAP_CENTER.lng + 0.45,
  west: DEFAULT_MAP_CENTER.lng - 0.45,
};

const KM_PER_DEGREE_LAT = 111.32;

export function boundsFromCenter(
  lat: number,
  lng: number,
  radiusKm: number,
): MapBounds {
  const latDelta = radiusKm / KM_PER_DEGREE_LAT;
  const lngDelta =
    radiusKm / (KM_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

export function mapViewportToQuery(viewport: MapViewport): SupplierMapListQuery {
  return {
    north: viewport.bounds.north,
    south: viewport.bounds.south,
    east: viewport.bounds.east,
    west: viewport.bounds.west,
    zoom: viewport.zoom,
  };
}
