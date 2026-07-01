import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { SupplierListItem } from '~/interfaces/catalogs/supplier';

export const useSupplierLocationCacheStore = defineStore(
  'supplierLocationCache',
  () => {
    const sessionHash = crypto.randomUUID();
    const suppliersById = ref(new Map<number, SupplierListItem>());

    const allSuppliers = computed(() =>
      Array.from(suppliersById.value.values()),
    );

    function mergeSuppliers(rows: SupplierListItem[]) {
      if (rows.length === 0) return;

      const next = new Map(suppliersById.value);
      for (const row of rows) {
        next.set(row.id, row);
      }
      suppliersById.value = next;
    }

    function upsertSupplier(row: SupplierListItem) {
      mergeSuppliers([row]);
    }

    return {
      sessionHash,
      allSuppliers,
      mergeSuppliers,
      upsertSupplier,
    };
  },
);
