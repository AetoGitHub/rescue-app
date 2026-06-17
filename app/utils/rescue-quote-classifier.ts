import {
  QUOTE_CLASSIFIER_IMAGE_MAX_BYTES,
  QUOTE_CLASSIFIER_STORAGE_PREFIX,
  QUOTE_CLASSIFIER_VOICE_FILENAME_PREFIX,
  QUOTE_CLASSIFIER_VOICE_MAX_BYTES,
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
  if (type !== 'text' && type !== 'image' && type !== 'voice') return null;

  return { input, type };
}

function parseClassifierLineRaw(item: unknown): QuoteClassifierLineRaw | null {
  if (item == null || typeof item !== 'object') return null;

  const record = item as Record<string, unknown>;
  const serviceId =
    record.service_id == null
      ? null
      : Number.isFinite(Number(record.service_id))
        ? Number(record.service_id)
        : null;

  const unitCostRaw = record.unit_cost;
  const unit_cost =
    unitCostRaw != null && Number.isFinite(Number(unitCostRaw))
      ? Number(unitCostRaw)
      : undefined;

  return {
    service_id: serviceId,
    service_label: String(record.service_label ?? '').trim(),
    quantity: Number.isFinite(Number(record.quantity)) ? Number(record.quantity) : 0,
    unit_cost,
  };
}

export function normalizeQuoteClassifierResponse(
  body: unknown,
): QuoteClassifierResponse | null {
  if (body == null || typeof body !== 'object') return null;

  const record = body as Record<string, unknown>;
  if (!Array.isArray(record.quote_lines) || record.quote_lines.length === 0) {
    return null;
  }

  const quote_lines = record.quote_lines
    .map(parseClassifierLineRaw)
    .filter((line): line is QuoteClassifierLineRaw => line != null);

  if (quote_lines.length === 0) return null;

  const success =
    typeof record.success === 'boolean' ? record.success : undefined;

  const notes = Array.isArray(record.notes)
    ? record.notes
        .filter((note): note is string => typeof note === 'string')
        .map((note) => note.trim())
        .filter(Boolean)
    : [];

  return { success, quote_lines, notes };
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
  if (response.success === false) {
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

function quoteClassifierFileExtension(name: string): string {
  const parts = name.split('.');
  if (parts.length < 2) return '';
  return (parts.at(-1) ?? '').toLowerCase();
}

export function isQuoteClassifierImageAllowed(file: File): boolean {
  const allowed = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
  const ext = quoteClassifierFileExtension(file.name);
  if (!ext || !allowed.has(ext)) return false;
  return file.size <= QUOTE_CLASSIFIER_IMAGE_MAX_BYTES;
}

export function isQuoteClassifierVoiceAllowed(file: File): boolean {
  const allowed = new Set(['webm', 'ogg', 'mp4', 'mpeg', 'mp3']);
  const ext = quoteClassifierFileExtension(file.name);
  if (!ext || !allowed.has(ext)) return false;
  return file.size <= QUOTE_CLASSIFIER_VOICE_MAX_BYTES;
}

export function buildQuoteClassifierVoiceFilename(extension = 'webm'): string {
  const safeExt = extension.replace(/[^\w]+/g, '') || 'webm';
  return `${QUOTE_CLASSIFIER_VOICE_FILENAME_PREFIX}-${Date.now()}.${safeExt}`;
}
