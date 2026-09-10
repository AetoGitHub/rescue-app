import { refDebounced } from '@vueuse/core';
import type { SupplierMapListQuery } from '~/interfaces/catalogs/supplier';
import type { MapViewport } from '~/utils/map-viewport';
import { getMapViewport, mapViewportToQuery } from '~/utils/map-viewport';

export function useSupplierMapViewport() {
  const viewport = ref<MapViewport | null>(null);
  const debouncedViewport = refDebounced(viewport, 300);

  const queryParams = computed<SupplierMapListQuery | null>(() => {
    const current = debouncedViewport.value;
    if (!current) return null;
    return mapViewportToQuery(current);
  });

  /**
   * Same debounced bounds as `queryParams`: pin filtering must never run
   * ahead of what's actually been fetched, or markers flicker in/out as
   * the map settles (and an immediate viewport recomputes the filter on
   * every `bounds_changed`, which is what made zooming out laggy).
   */
  const displayQueryParams = queryParams;

  function updateFromMap(map: google.maps.Map | null | undefined) {
    viewport.value = getMapViewport(map);
  }

  function setViewport(next: MapViewport) {
    viewport.value = next;
  }

  return {
    viewport,
    debouncedViewport,
    queryParams,
    displayQueryParams,
    updateFromMap,
    setViewport,
  };
}
