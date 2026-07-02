import type { AlegraItem, AlegraItemDisplay } from '~/interfaces/alegra/item.interface';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';

export const ALEGRA_ITEMS_BASE = 'https://api.alegra.com/api/v1/items';
export const ALEGRA_ITEMS_LIMIT = 30;

const ALEGRA_LIST_DEFAULTS = {
  metadata: 'false',
  limit: String(ALEGRA_ITEMS_LIMIT),
  order_direction: 'ASC',
  order_field: 'name',
  mode: 'simple',
} as const;

export function parseAlegraItemId(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function resolveAlegraAuthorizationHeader(): string {
  const token = String(useRuntimeConfig().alegraApiToken ?? '').trim();

  if (!token) {
    throw createError({
      statusCode: 503,
      message: 'Integración con Alegra no configurada',
    });
  }

  return buildAlegraAuthorizationHeader(token);
}

/**
 * Alegra usa Basic auth. Acepta:
 * - Credencial base64 (como en el SDK: .auth('Y2Fy...'))
 * - `email:token` en texto plano
 * - Header completo `Basic ...`
 */
export function buildAlegraAuthorizationHeader(credential: string): string {
  const value = credential.trim();

  if (value.toLowerCase().startsWith('basic ')) {
    return value;
  }

  if (value.includes('@') && value.includes(':')) {
    return `Basic ${Buffer.from(value).toString('base64')}`;
  }

  return `Basic ${value}`;
}

export function buildAlegraItemsListQuery(input: {
  query?: string;
  start?: number;
}) {
  const query: Record<string, string> = { ...ALEGRA_LIST_DEFAULTS };

  const search = input.query?.trim();
  if (search) {
    query.query = search;
  }

  const start = input.start ?? 0;
  if (start > 0) {
    query.start = String(start);
  }

  return query;
}

export function parseAlegraItemsListResponse(data: unknown): AlegraItem[] {
  if (Array.isArray(data)) {
    return data as AlegraItem[];
  }

  if (data && typeof data === 'object' && 'data' in data) {
    const nested = (data as { data?: unknown }).data;
    if (Array.isArray(nested)) {
      return nested as AlegraItem[];
    }
  }

  return [];
}

export function mapAlegraItemToDropdownRow(item: AlegraItem): CatalogDropdownRow | null {
  const id = parseAlegraItemId(item.id);
  if (id == null) return null;

  const name = String(item.name ?? '').trim();
  const reference = String(item.reference ?? '').trim();

  return {
    id,
    name: name || reference || `Ítem #${id}`,
  };
}

export function formatAlegraItemDisplay(item: AlegraItem): AlegraItemDisplay | null {
  const id = parseAlegraItemId(item.id);
  if (id == null) return null;

  const name = String(item.name ?? '').trim();
  const reference = String(item.reference ?? '').trim() || null;

  return {
    id,
    name: name || reference || `Ítem #${id}`,
    reference,
  };
}

export function mapAlegraItemsToDropdownResults(items: AlegraItem[]): CatalogDropdownRow[] {
  return items
    .map(mapAlegraItemToDropdownRow)
    .filter((row): row is CatalogDropdownRow => row != null);
}
