import type { SupplierListItem } from '~/interfaces/catalogs/supplier';
import { coordsFromSupplierRow, parseSupplierCoord } from '~/utils/supplier-list';

export type SupplierCatalogMapPin = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  is_trusted: boolean;
};

type DetailCoordsStatus = 'idle' | 'loading' | 'success' | 'error';

function coordsFromDetailRaw(
  raw: Record<string, unknown>,
): { lat: number; lng: number } | null {
  const lat = parseSupplierCoord(
    (raw.latitude ?? raw.lat) as string | number | null | undefined,
  );
  const lng = parseSupplierCoord(
    (raw.longitude ?? raw.lng) as string | number | null | undefined,
  );
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function useSupplierMapPins(suppliers: Ref<SupplierListItem[]>) {
  const apiFetch = useApiFetch();
  const detailCoordsById = ref<Record<number, { lat: number; lng: number }>>({});
  const detailCoordsStatus = ref<DetailCoordsStatus>('idle');
  let fetchGeneration = 0;

  const idsMissingListCoords = computed(() =>
    suppliers.value
      .filter((supplier) => coordsFromSupplierRow(supplier) == null)
      .map((supplier) => supplier.id),
  );

  watch(
    idsMissingListCoords,
    async (ids) => {
      const generation = ++fetchGeneration;
      if (ids.length === 0) {
        detailCoordsStatus.value = 'idle';
        detailCoordsById.value = {};
        return;
      }

      detailCoordsStatus.value = 'loading';

      try {
        const entries = await Promise.all(
          ids.map(async (id) => {
            try {
              const raw = await apiFetch<Record<string, unknown>>(
                `/api/supplier/detail/${id}/`,
              );
              const coords = coordsFromDetailRaw(raw);
              return coords ? ([id, coords] as const) : null;
            } catch {
              return null;
            }
          }),
        );

        if (generation !== fetchGeneration) return;

        detailCoordsById.value = Object.fromEntries(
          entries.filter((entry): entry is [number, { lat: number; lng: number }] => entry != null),
        );
        detailCoordsStatus.value = 'success';
      } catch {
        if (generation !== fetchGeneration) return;
        detailCoordsStatus.value = 'error';
      }
    },
    { immediate: true },
  );

  const pins = computed((): SupplierCatalogMapPin[] =>
    suppliers.value.flatMap((supplier) => {
      const fromList = coordsFromSupplierRow(supplier);
      const fromDetail = detailCoordsById.value[supplier.id] ?? null;
      const coords = fromList ?? fromDetail;
      if (!coords) return [];

      return [{
        id: supplier.id,
        name: supplier.name,
        lat: coords.lat,
        lng: coords.lng,
        is_trusted: supplier.is_trusted,
      }];
    }),
  );

  const isResolvingCoords = computed(
    () =>
      idsMissingListCoords.value.length > 0
      && detailCoordsStatus.value === 'loading',
  );

  const suppliersWithoutCoords = computed(() => {
    const pinIds = new Set(pins.value.map((pin) => pin.id));
    return suppliers.value.filter((supplier) => !pinIds.has(supplier.id)).length;
  });

  return {
    pins,
    isResolvingCoords,
    suppliersWithoutCoords,
  };
}
