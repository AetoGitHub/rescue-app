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

export function mapViewportToQuery(viewport: MapViewport): SupplierMapListQuery {
  return {
    north: viewport.bounds.north,
    south: viewport.bounds.south,
    east: viewport.bounds.east,
    west: viewport.bounds.west,
    zoom: viewport.zoom,
  };
}
