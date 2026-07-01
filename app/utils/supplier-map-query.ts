import type { SupplierServiceType } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierSort } from '~/interfaces/rescue';
import type { MapBounds } from '~/utils/map-viewport';

export type BuildSupplierMapQueryOptions = {
  hash: string;
  bounds: MapBounds;
  name?: string;
  trustedOnly?: boolean;
  serviceType?: SupplierServiceType | 'all';
  orderBy?: RescueSupplierSort;
  unitLat?: number | null;
  unitLng?: number | null;
  zoom?: number;
};

export function buildSupplierMapQuery(
  options: BuildSupplierMapQueryOptions,
): Record<string, string> {
  const query: Record<string, string> = {
    north: String(options.bounds.north),
    south: String(options.bounds.south),
    east: String(options.bounds.east),
    west: String(options.bounds.west),
    hash: options.hash,
  };

  if (options.zoom != null) {
    query.zoom = String(options.zoom);
  }

  const name = options.name?.trim();
  if (name) {
    query.name = name;
  }

  if (options.trustedOnly) {
    query.is_trusted = 'true';
  }

  if (options.serviceType && options.serviceType !== 'all') {
    query.service_type = options.serviceType;
  }

  if (options.orderBy) {
    query.order_by = options.orderBy;
  }

  if (
    options.orderBy === 'distance'
    && options.unitLat != null
    && options.unitLng != null
  ) {
    query.lat = String(options.unitLat);
    query.lng = String(options.unitLng);
  }

  return query;
}
