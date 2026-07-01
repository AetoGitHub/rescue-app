import type { SupplierServiceType } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierSort } from '~/interfaces/rescue';
import { mapCenterFromBounds, type MapBounds } from '~/utils/map-viewport';

export type BuildSupplierMapQueryOptions = {
  hash: string;
  bounds: MapBounds;
  name?: string;
  trustedOnly?: boolean;
  serviceType?: SupplierServiceType | 'all';
  orderBy?: RescueSupplierSort;
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

  const center = mapCenterFromBounds(options.bounds);
  query.lat = String(center.lat);
  query.lng = String(center.lng);

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

  return query;
}
