import type {
  AlegraItem,
  AlegraItemDisplay,
  AlegraItemsListPage,
} from '~/interfaces/alegra/item.interface';
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

function normalizeAlegraOffset(value: unknown): string | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return String(parsed);
}

export function parseAlegraItemsListResponse(data: unknown): AlegraItemsListPage {
  if (Array.isArray(data)) {
    return { items: data as AlegraItem[], next: null, previous: null };
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    if (Array.isArray(record.results)) {
      return {
        items: record.results as AlegraItem[],
        next: normalizeAlegraOffset(record.next),
        previous: normalizeAlegraOffset(record.previous),
      };
    }

    if (Array.isArray(record.data)) {
      return { items: record.data as AlegraItem[], next: null, previous: null };
    }
  }

  return { items: [], next: null, previous: null };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseAlegraRateLimitWaitSeconds(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (record.code !== 429) return null;

  const headers = record.headers;
  if (!headers || typeof headers !== 'object') return null;

  const reset = (headers as Record<string, unknown>)['x-rate-limit-reset'];
  const seconds = Number(reset);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.ceil(seconds);
}

/** Reintenta ante rate limit (429) respetando `x-rate-limit-reset` de Alegra. */
export async function fetchAlegraJson<T>(
  url: string,
  options: Parameters<typeof $fetch>[1] = {},
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await $fetch<T>(url, options);
      const waitFromBody = parseAlegraRateLimitWaitSeconds(data);
      if (waitFromBody != null && attempt < maxRetries) {
        await sleep(waitFromBody * 1000);
        continue;
      }
      if (waitFromBody != null) {
        throw createError({
          statusCode: 429,
          message: 'Rate limit de Alegra alcanzado',
        });
      }
      return data;
    } catch (error) {
      const waitSeconds = extractAlegraRateLimitWait(error);
      if (waitSeconds != null && attempt < maxRetries) {
        await sleep(waitSeconds * 1000);
        continue;
      }
      throw error;
    }
  }

  throw createError({ statusCode: 502, message: 'No se pudo consultar Alegra' });
}

function extractAlegraRateLimitWait(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;

  const record = error as Record<string, unknown>;
  const statusCode = Number(record.statusCode ?? record.status);
  if (statusCode !== 429) return null;

  const fromBody = parseAlegraRateLimitWaitSeconds(record.data);
  if (fromBody != null) return fromBody;

  const response = record.response as { headers?: Record<string, unknown> } | undefined;
  const headers = (response?.headers ?? record.headers) as Record<string, unknown> | undefined;
  if (headers) {
    const reset = headers['x-rate-limit-reset'];
    const seconds = Number(reset);
    if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);
  }

  return 60;
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
