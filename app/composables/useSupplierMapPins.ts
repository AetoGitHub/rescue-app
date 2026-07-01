import type { SupplierListItem } from '~/interfaces/catalogs/supplier';
import { coordsFromSupplierRow } from '~/utils/supplier-list';

export type SupplierCatalogMapPin = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  is_trusted: boolean;
};

export function useSupplierMapPins(suppliers: Ref<SupplierListItem[]>) {
  const pins = computed((): SupplierCatalogMapPin[] =>
    suppliers.value.flatMap((supplier) => {
      const coords = coordsFromSupplierRow(supplier);
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

  const suppliersWithoutCoords = computed(() => {
    const pinIds = new Set(pins.value.map((pin) => pin.id));
    return suppliers.value.filter((supplier) => !pinIds.has(supplier.id)).length;
  });

  return {
    pins,
    suppliersWithoutCoords,
  };
}
