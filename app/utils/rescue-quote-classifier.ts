import {
  QUOTE_CLASSIFIER_IMAGE_MAX_BYTES,
  QUOTE_CLASSIFIER_STORAGE_PREFIX,
} from '~/constants/quote-classifier-api';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import type {
  QuoteClassifierLineRaw,
  QuoteClassifierRequestBody,
  QuoteClassifierResponse,
} from '~/interfaces/rescue/quote-classifier';

export function parseQuoteClassifierRequestBody(
  body: unknown,
): QuoteClassifierRequestBody | null {
  if (body == null || typeof body !== 'object') return null;

  const record = body as Record<string, unknown>;
  const input = typeof record.input === 'string' ? record.input.trim() : '';
  if (input.length === 0) return null;

  const type = record.type;
  if (type !== 'text' && type !== 'image') return null;

  return { input, type };
}

export function mapClassifierLineToQuoteLine(
  raw: QuoteClassifierLineRaw,
): RescueQuoteLine {
  const serviceId =
    raw.service_id != null && Number.isFinite(Number(raw.service_id))
      ? Number(raw.service_id)
      : null;

  return {
    id: crypto.randomUUID(),
    service_id: serviceId,
    service_label: String(raw.service_label ?? '').trim(),
    quantity: Number.isFinite(Number(raw.quantity)) ? Number(raw.quantity) : 0,
    unit_cost: Number.isFinite(Number(raw.unit_cost)) ? Number(raw.unit_cost) : 0,
    contract_item_id: null,
  };
}

export function mapClassifierResponseToQuoteLines(
  response: QuoteClassifierResponse,
): RescueQuoteLine[] {
  if (!response.success) {
    throw new Error('El clasificador no pudo generar renglones');
  }

  const lines = Array.isArray(response.quote_lines) ? response.quote_lines : [];
  if (lines.length === 0) {
    throw new Error('El clasificador no devolvió renglones');
  }

  return lines.map(mapClassifierLineToQuoteLine);
}

export function normalizeClassifierNotes(response: QuoteClassifierResponse): string[] {
  if (!Array.isArray(response.notes)) return [];
  return response.notes
    .filter((note): note is string => typeof note === 'string')
    .map((note) => note.trim())
    .filter(Boolean);
}

export function classifierResponseHasUnmatchedLines(
  response: QuoteClassifierResponse,
): boolean {
  return response.quote_lines.some((line) => line.service_id == null);
}

export function buildQuoteClassifierStoragePath(filename: string): string {
  const safeName = filename.replace(/[^\w.-]+/g, '_') || 'image';
  return `${QUOTE_CLASSIFIER_STORAGE_PREFIX}/${crypto.randomUUID()}/${safeName}`;
}

export function isQuoteClassifierImageAllowed(file: File): boolean {
  const allowed = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
  const parts = file.name.split('.');
  const ext = parts.length >= 2 ? (parts.at(-1) ?? '').toLowerCase() : '';
  if (!ext || !allowed.has(ext)) return false;
  return file.size <= QUOTE_CLASSIFIER_IMAGE_MAX_BYTES;
}
