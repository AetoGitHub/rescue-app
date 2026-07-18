export type LatLngLiteral = { lat: number; lng: number };

export function fitMapToPoints(
  map: google.maps.Map,
  points: LatLngLiteral[],
) {
  if (points.length === 0) return;

  if (points.length === 1) {
    const point = points[0];
    if (!point) return;
    map.panTo(point);
    const zoom = map.getZoom();
    if (zoom == null || zoom < 12) {
      map.setZoom(12);
    }
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  for (const point of points) {
    bounds.extend(point);
  }
  map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
}
