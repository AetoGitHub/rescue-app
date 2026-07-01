import type {
  SupplierCreateBody,
  SupplierListItem,
  SupplierMapListQuery,
  SupplierServiceType,
} from '~/interfaces/catalogs/supplier';
import type { RescueSupplierNearbyRow, RescueSupplierSort } from '~/interfaces/rescue';
import type { MapBounds } from '~/utils/map-viewport';
import {
  coordsFromSupplierRow,
  groupTrustedFirst,
  mapSupplierListItem,
} from '~/utils/supplier-list';

const EARTH_RADIUS_KM = 6371;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1))
    * Math.cos(toRad(lat2))
    * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceToUnitKm(
  row: Pick<SupplierListItem, 'latitude' | 'longitude' | 'distance_km'>,
  unitLat: number,
  unitLng: number,
): number | null {
  const coords = coordsFromSupplierRow(row);
  if (coords) {
    return haversineKm(unitLat, unitLng, coords.lat, coords.lng);
  }

  const cached = row.distance_km;
  return cached != null && Number.isFinite(cached) ? cached : null;
}

export function isSupplierInBounds(
  row: Pick<SupplierListItem, 'latitude' | 'longitude'>,
  bounds: Pick<MapBounds, 'north' | 'south' | 'east' | 'west'>,
): boolean {
  const coords = coordsFromSupplierRow(row);
  if (!coords) return false;

  const { lat, lng } = coords;
  if (lat < bounds.south || lat > bounds.north) return false;

  const { east, west } = bounds;
  if (west <= east) {
    return lng >= west && lng <= east;
  }

  return lng >= west || lng <= east;
}

export function filterSuppliersForMapView(
  suppliers: SupplierListItem[],
  viewport: Pick<
    SupplierMapListQuery,
    'north' | 'south' | 'east' | 'west'
  >,
  filters: {
    name: string;
    trustedOnly: boolean;
    serviceType: SupplierServiceType | 'all';
  },
): SupplierListItem[] {
  const nameQuery = filters.name.trim().toLowerCase();

  return suppliers.filter((supplier) => {
    if (!isSupplierInBounds(supplier, viewport)) return false;
    if (filters.trustedOnly && !supplier.is_trusted) return false;
    if (
      filters.serviceType !== 'all'
      && !supplier.service_type.includes(filters.serviceType)
    ) {
      return false;
    }
    if (nameQuery && !supplier.name.toLowerCase().includes(nameQuery)) {
      return false;
    }
    return true;
  });
}

export function filterAndSortRescueSuppliers(
  suppliers: SupplierListItem[],
  options: {
    name: string;
    sort: RescueSupplierSort;
    unitLat: number | null;
    unitLng: number | null;
    serviceType: SupplierServiceType | 'all';
    trustedOnly: boolean;
  },
): RescueSupplierNearbyRow[] {
  const nameQuery = options.name.trim().toLowerCase();

  let filtered = suppliers.filter((supplier) => {
    if (options.trustedOnly && !supplier.is_trusted) return false;
    if (
      options.serviceType !== 'all'
      && !supplier.service_type.includes(options.serviceType)
    ) {
      return false;
    }
    if (nameQuery && !supplier.name.toLowerCase().includes(nameQuery)) {
      return false;
    }
    return true;
  });

  if (options.sort === 'ranking') {
    filtered = [...filtered].sort((a, b) => b.score - a.score);
  } else if (options.sort === 'name') {
    filtered = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, 'es'),
    );
  } else if (
    options.sort === 'distance'
    && options.unitLat != null
    && options.unitLng != null
  ) {
    const unitLat = options.unitLat;
    const unitLng = options.unitLng;
    filtered = [...filtered].sort((a, b) => {
      const distA = distanceToUnitKm(a, unitLat, unitLng);
      const distB = distanceToUnitKm(b, unitLat, unitLng);
      if (distA == null && distB == null) return 0;
      if (distA == null) return 1;
      if (distB == null) return -1;
      return distA - distB;
    });
  }

  const rows = filtered.map((supplier) => {
    if (
      options.sort === 'distance'
      && options.unitLat != null
      && options.unitLng != null
    ) {
      const distance_km = distanceToUnitKm(
        supplier,
        options.unitLat,
        options.unitLng,
      );
      return mapSupplierListItem({ ...supplier, distance_km });
    }
    return mapSupplierListItem(supplier);
  });

  return groupTrustedFirst(rows);
}

export function supplierListItemFromCreateBody(
  id: number,
  body: SupplierCreateBody,
  extras?: Partial<SupplierListItem>,
): SupplierListItem {
  return {
    id,
    name: body.name.trim(),
    service_type: body.service_type,
    phone: body.phone,
    is_trusted: body.is_trusted,
    is_active: extras?.is_active ?? true,
    score: extras?.score ?? 0,
    rescues_count: extras?.rescues_count ?? 0,
    latitude: body.latitude || null,
    longitude: body.longitude || null,
    ...extras,
  };
}
