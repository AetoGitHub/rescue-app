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

  /** Immediate bounds for pin filtering (no debounce). */
  const displayQueryParams = computed<SupplierMapListQuery | null>(() => {
    const current = viewport.value;
    if (!current) return null;
    return mapViewportToQuery(current);
  });

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
