import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import type { SupplierListItem } from '../../app/interfaces/catalogs/supplier';
import { useSupplierLocationCacheStore } from '../../app/stores/supplierLocationCache';
import {
  filterAndSortRescueSuppliers,
  filterSuppliersForMapView,
  isSupplierInBounds,
  supplierListItemFromCreateBody,
} from '../../app/utils/supplier-location-cache';

function makeSupplier(
  overrides: Partial<SupplierListItem> & Pick<SupplierListItem, 'id' | 'name'>,
): SupplierListItem {
  return {
    service_type: ['cranes'],
    phone: '',
    is_trusted: false,
    is_active: true,
    score: 0,
    rescues_count: 0,
    ...overrides,
  };
}

const viewport = {
  north: 20,
  south: 19,
  east: -99,
  west: -100,
};

describe('isSupplierInBounds', () => {
  it('returns true when coords are inside bounds', () => {
    const row = makeSupplier({
      id: 1,
      name: 'Dentro',
      latitude: '19.5',
      longitude: '-99.5',
    });
    expect(isSupplierInBounds(row, viewport)).toBe(true);
  });

  it('returns false when coords are outside bounds', () => {
    const row = makeSupplier({
      id: 2,
      name: 'Fuera',
      latitude: '21',
      longitude: '-99.5',
    });
    expect(isSupplierInBounds(row, viewport)).toBe(false);
  });

  it('returns false when supplier has no coords', () => {
    const row = makeSupplier({ id: 3, name: 'Sin coords' });
    expect(isSupplierInBounds(row, viewport)).toBe(false);
  });

  it('handles antimeridian crossing', () => {
    const row = makeSupplier({
      id: 4,
      name: 'Pacific',
      latitude: '10',
      longitude: '179',
    });
    expect(
      isSupplierInBounds(row, {
        north: 20,
        south: 0,
        east: -170,
        west: 170,
      }),
    ).toBe(true);
  });
});

describe('filterSuppliersForMapView', () => {
  const suppliers = [
    makeSupplier({
      id: 1,
      name: 'Alpha Grúas',
      latitude: '19.5',
      longitude: '-99.5',
      is_trusted: true,
      service_type: ['cranes'],
    }),
    makeSupplier({
      id: 2,
      name: 'Beta Mecánica',
      latitude: '19.6',
      longitude: '-99.4',
      is_trusted: false,
      service_type: ['mechanics'],
    }),
    makeSupplier({
      id: 3,
      name: 'Gamma Fuera',
      latitude: '21',
      longitude: '-99.5',
      service_type: ['cranes'],
    }),
  ];

  it('filters by viewport bounds', () => {
    const result = filterSuppliersForMapView(suppliers, viewport, {
      name: '',
      trustedOnly: false,
      serviceType: 'all',
    });
    expect(result.map((s) => s.id)).toEqual([1, 2]);
  });

  it('filters by name, trusted and service type', () => {
    const result = filterSuppliersForMapView(suppliers, viewport, {
      name: 'alpha',
      trustedOnly: true,
      serviceType: 'cranes',
    });
    expect(result.map((s) => s.id)).toEqual([1]);
  });
});

describe('filterAndSortRescueSuppliers', () => {
  const defaultFilters = {
    serviceType: 'all' as const,
    trustedOnly: false,
  };

  const suppliers = [
    makeSupplier({
      id: 1,
      name: 'Zeta',
      score: 3,
      is_trusted: false,
      latitude: '19.5',
      longitude: '-99.5',
    }),
    makeSupplier({
      id: 2,
      name: 'Alpha',
      score: 5,
      is_trusted: true,
      latitude: '19.6',
      longitude: '-99.4',
    }),
    makeSupplier({
      id: 3,
      name: 'Beta',
      score: 4,
      is_trusted: false,
      latitude: '19.7',
      longitude: '-99.3',
    }),
  ];

  it('sorts by ranking descending', () => {
    const result = filterAndSortRescueSuppliers(suppliers, {
      name: '',
      sort: 'ranking',
      unitLat: null,
      unitLng: null,
      ...defaultFilters,
    });
    expect(result.map((s) => s.id)).toEqual([2, 3, 1]);
  });

  it('sorts alphabetically by name', () => {
    const result = filterAndSortRescueSuppliers(suppliers, {
      name: '',
      sort: 'name',
      unitLat: null,
      unitLng: null,
      ...defaultFilters,
    });
    expect(result.map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Zeta']);
  });

  it('sorts by distance from unit when coords are available', () => {
    const distanceSuppliers = [
      makeSupplier({
        id: 1,
        name: 'Lejos',
        is_trusted: false,
        latitude: '19.7',
        longitude: '-99.3',
      }),
      makeSupplier({
        id: 2,
        name: 'Cerca',
        is_trusted: false,
        latitude: '19.44',
        longitude: '-99.14',
      }),
      makeSupplier({
        id: 3,
        name: 'Medio',
        is_trusted: false,
        latitude: '19.55',
        longitude: '-99.25',
      }),
    ];
    const result = filterAndSortRescueSuppliers(distanceSuppliers, {
      name: '',
      sort: 'distance',
      unitLat: 19.432608,
      unitLng: -99.133209,
      ...defaultFilters,
    });
    expect(result.map((s) => s.id)).toEqual([2, 3, 1]);
    expect(result[0]?.distance_km).toBeLessThan(result[1]?.distance_km ?? 0);
    expect(result[1]?.distance_km).toBeLessThan(result[2]?.distance_km ?? 0);
  });

  it('filters by search name', () => {
    const result = filterAndSortRescueSuppliers(suppliers, {
      name: 'alpha',
      sort: 'name',
      unitLat: null,
      unitLng: null,
      ...defaultFilters,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Alpha');
  });

  it('filters by trusted only and service type', () => {
    const mixed = [
      makeSupplier({
        id: 1,
        name: 'Trusted Grúas',
        is_trusted: true,
        service_type: ['cranes'],
        score: 4,
      }),
      makeSupplier({
        id: 2,
        name: 'Trusted Mecánica',
        is_trusted: true,
        service_type: ['mechanics'],
        score: 5,
      }),
      makeSupplier({
        id: 3,
        name: 'No trusted',
        is_trusted: false,
        service_type: ['cranes'],
        score: 5,
      }),
    ];
    const result = filterAndSortRescueSuppliers(mixed, {
      name: '',
      sort: 'ranking',
      unitLat: null,
      unitLng: null,
      serviceType: 'cranes',
      trustedOnly: true,
    });
    expect(result.map((s) => s.id)).toEqual([1]);
  });
});

describe('supplierListItemFromCreateBody', () => {
  it('maps create body fields to list item', () => {
    const item = supplierListItemFromCreateBody(10, {
      name: ' Nuevo ',
      description: '',
      phone: '81 1234 5678',
      email: '',
      service_type: ['road_assist'],
      is_trusted: true,
      notes: '',
      latitude: '19.43',
      longitude: '-99.13',
    });
    expect(item).toMatchObject({
      id: 10,
      name: 'Nuevo',
      phone: '81 1234 5678',
      service_type: ['road_assist'],
      is_trusted: true,
      latitude: '19.43',
      longitude: '-99.13',
    });
  });
});

describe('useSupplierLocationCacheStore', () => {
  it('deduplicates suppliers by id on merge', () => {
    setActivePinia(createPinia());
    const store = useSupplierLocationCacheStore();
    const first = makeSupplier({
      id: 1,
      name: 'Original',
      latitude: '19.5',
      longitude: '-99.5',
    });
    const updated = makeSupplier({
      id: 1,
      name: 'Actualizado',
      latitude: '19.6',
      longitude: '-99.4',
    });

    store.mergeSuppliers([first]);
    store.mergeSuppliers([updated]);

    expect(store.allSuppliers).toHaveLength(1);
    expect(store.allSuppliers[0]?.name).toBe('Actualizado');
  });

  it('exposes a stable session hash', () => {
    setActivePinia(createPinia());
    const store = useSupplierLocationCacheStore();
    expect(store.sessionHash).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
