import type {
  SupplierListItem,
  SupplierServiceType,
} from '~/interfaces/catalogs/supplier';
import type { RescueSupplierNearbyRow } from '~/interfaces/rescue';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';
import { toSupplierServiceTypes } from '~/utils/catalog-detail-map';

export function parseSupplierCoord(
  value: string | number | null | undefined,
): number | null {
  if (value == null) return null;
  const parsed = Number(String(value).trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function coordsFromSupplierRow(
  row: Pick<SupplierListItem, 'latitude' | 'longitude'>,
): { lat: number; lng: number } | null {
  const lat = parseSupplierCoord(row.latitude);
  const lng = parseSupplierCoord(row.longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

function normalizeSupplierCoordField(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    return parseSupplierCoord(trimmed) != null ? trimmed : null;
  }
  return null;
}

function readSupplierCoordsFromRaw(raw: Record<string, unknown>) {
  const location = raw.location as Record<string, unknown> | undefined;
  const latitudeRaw =
    raw.latitude ?? raw.lat ?? location?.latitude ?? null;
  const longitudeRaw =
    raw.longitude ?? raw.lng ?? location?.longitude ?? null;
  return {
    latitude: normalizeSupplierCoordField(latitudeRaw),
    longitude: normalizeSupplierCoordField(longitudeRaw),
  };
}

export function mapSupplierListRow(
  raw: Record<string, unknown>,
): SupplierListItem {
  const distanceRaw = raw.distance_km ?? raw.distance;
  const distance_km =
    distanceRaw != null && Number.isFinite(Number(distanceRaw))
      ? Number(distanceRaw)
      : null;
  const { latitude, longitude } = readSupplierCoordsFromRaw(raw);

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
    latitude,
    longitude,
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
    service_type: row.service_type,
  };
}

const supplierServiceTypeLabelByValue = new Map<string, string>(
  SUPPLIER_SERVICE_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

export function formatSupplierServiceTypeLabel(
  value: SupplierServiceType,
): string {
  return supplierServiceTypeLabelByValue.get(value) ?? value;
}

export function partitionSuppliersByTrust(list: RescueSupplierNearbyRow[]): {
  trusted: RescueSupplierNearbyRow[];
  others: RescueSupplierNearbyRow[];
} {
  const trusted = list.filter((s) => s.is_trusted);
  const others = list.filter((s) => !s.is_trusted);
  return { trusted, others };
}

export function groupTrustedFirst(
  list: RescueSupplierNearbyRow[],
): RescueSupplierNearbyRow[] {
  const trusted = list.filter((s) => s.is_trusted);
  const rest = list.filter((s) => !s.is_trusted);
  return [...trusted, ...rest];
}
