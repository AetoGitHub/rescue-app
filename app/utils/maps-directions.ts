import type { LatLngLiteral } from '~/utils/map-bounds';

export type MapLatLng = LatLngLiteral;

/** Minimal shape of a Maps JS Routes library route (types may lag @types/google.maps). */
export type DrivingRoute = {
  createPolylines: (
    options?: google.maps.PolylineOptions,
  ) => google.maps.Polyline[];
};

type RoutesLibrary = {
  Route: {
    computeRoutes: (request: {
      origin: MapLatLng;
      destination: MapLatLng;
      travelMode?: string;
      fields?: string[];
    }) => Promise<{ routes?: DrivingRoute[] | null }>;
  };
};

const DEFAULT_ROUTE_POLYLINE: google.maps.PolylineOptions = {
  strokeColor: '#2563eb',
  strokeOpacity: 0.85,
  strokeWeight: 4,
};

/**
 * Computes a driving route via the Maps JS Routes library (`Route.computeRoutes`).
 * Returns null when there is no route or the request fails (map stays usable).
 * Requires Routes API enabled on the same Google Maps API key.
 */
export async function requestDrivingRoute(
  origin: MapLatLng,
  destination: MapLatLng,
  RouteClass?: RoutesLibrary['Route'],
): Promise<DrivingRoute | null> {
  if (typeof google === 'undefined' || google.maps?.importLibrary == null) {
    return null;
  }

  try {
    const Route =
      RouteClass
      ?? (
        (await google.maps.importLibrary('routes')) as RoutesLibrary
      ).Route;

    const { routes } = await Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path'],
    });

    return routes?.[0] ?? null;
  } catch {
    return null;
  }
}

/** Draws route polylines on the map; caller owns clearing via clearRoutePolylines. */
export function drawDrivingRoutePolylines(
  map: google.maps.Map,
  route: DrivingRoute,
  options: google.maps.PolylineOptions = DEFAULT_ROUTE_POLYLINE,
): google.maps.Polyline[] {
  const polylines = route.createPolylines(options);
  for (const polyline of polylines) {
    polyline.setOptions(options);
    polyline.setMap(map);
  }
  return polylines;
}

export function clearRoutePolylines(
  polylines: google.maps.Polyline[] | null | undefined,
) {
  if (polylines == null) return;
  for (const polyline of polylines) {
    polyline.setMap(null);
  }
}
