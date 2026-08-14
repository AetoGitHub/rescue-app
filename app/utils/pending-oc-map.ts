import type {
  PendingOcContact,
  PendingOcResponse,
} from '~/interfaces/nexxt-step/pending-oc';

function toId(value: unknown): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Saca `key` del enlace que arma el backend (`/admin/llenar-oc?key=…`). */
export function extractPendingOcKeyFromUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed, 'https://placeholder.local');
    return parsed.searchParams.get('key')?.trim() ?? '';
  } catch {
    return '';
  }
}

export function mapPendingOcContact(raw: unknown): PendingOcContact | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  const id = toId(record.id);
  if (id === 0) return null;

  const url = toText(record.url);

  return {
    id,
    contact_name: toText(record.contact_name),
    whatsapp_number: toText(record.whatsapp_number),
    url,
    key: extractPendingOcKeyFromUrl(url),
  };
}

export function mapPendingOcResponse(raw: unknown): PendingOcResponse {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { contacts: [] };
  }

  const contacts = (raw as Record<string, unknown>).contacts;
  if (!Array.isArray(contacts)) {
    return { contacts: [] };
  }

  return {
    contacts: contacts
      .map(mapPendingOcContact)
      .filter((item): item is PendingOcContact => item != null),
  };
}
