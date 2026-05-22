import type { SupplierListItem } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierNearbyRow } from '~/interfaces/rescue';
import { toSupplierServiceTypes } from '~/utils/catalog-detail-map';

export function mapSupplierListRow(
  raw: Record<string, unknown>,
): SupplierListItem {
  const distanceRaw = raw.distance_km ?? raw.distance;
  const distance_km =
    distanceRaw != null && Number.isFinite(Number(distanceRaw))
      ? Number(distanceRaw)
      : null;

  return {
    id: Number(raw.id),
    name: String(raw.name ?? '').trim(),
    service_type: toSupplierServiceTypes(raw.service_types ?? raw.service_type),
    phone: String(raw.phone ?? ''),
    is_trusted: Boolean(raw.is_trusted),
    is_active: raw.is_active !== false,
    score: Number(raw.score) || 0,
    rescues_count: Number(raw.rescues_count) || 0,
    distance_km,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
  };
}

export function formatSupplierRescuesCount(count: number): string {
  if (count === 1) return '1 rescate';
  return `${count} rescates`;
}

export function mapSupplierListItem(
  row: SupplierListItem,
): RescueSupplierNearbyRow {
  const distanceRaw = row.distance_km ?? row.distance;
  const distance_km =
    distanceRaw != null && Number.isFinite(Number(distanceRaw))
      ? Number(distanceRaw)
      : null;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    is_trusted: row.is_trusted,
    score: row.score,
    rescues_count: row.rescues_count,
    ranking: row.score,
    distance_km,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  };
}

export function groupTrustedFirst(
  list: RescueSupplierNearbyRow[],
): RescueSupplierNearbyRow[] {
  const trusted = list.filter((s) => s.is_trusted);
  const rest = list.filter((s) => !s.is_trusted);
  return [...trusted, ...rest];
}
