import { joinURL } from 'ufo';
import { QUOTE_PDF_API_DEFAULT } from '~/constants/quote-pdf-api';
import type {
  TmsPurchaseOrderUploadFile,
  TmsPurchaseOrderUploadResponse,
} from '~/interfaces/portals/tms';
import { resolveQuotePdfApiUrl } from './quote-pdf-api';

export interface PurchaseOrderMultipartPart {
  name?: string;
  filename?: string;
  type?: string;
  data: Uint8Array;
}

export interface PurchaseOrderRejectedFile {
  fileName: string;
  reason: string;
}

export interface PurchaseOrderParseResult {
  accepted: PurchaseOrderMultipartPart[];
  rejected: PurchaseOrderRejectedFile[];
}

const MAX_FILES_PER_BATCH = 20;

export function buildPurchaseOrderUploadUrl(baseUrl: string): string {
  return joinURL(baseUrl.trim() || QUOTE_PDF_API_DEFAULT, '/purchase-orders/upload');
}

export function resolvePurchaseOrderUploadUrl(): string {
  return buildPurchaseOrderUploadUrl(resolveQuotePdfApiUrl());
}

/**
 * Separa los PDFs válidos de los que el usuario no debería reintentar, para que
 * un archivo inválido no invalide el lote completo.
 */
export function parsePurchaseOrderPdfParts(
  parts: PurchaseOrderMultipartPart[] | undefined,
): PurchaseOrderParseResult {
  const files = (parts ?? []).filter((part) => part.name === 'files');

  if (files.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Selecciona al menos un archivo PDF',
    });
  }
  if (files.length > MAX_FILES_PER_BATCH) {
    throw createError({
      statusCode: 400,
      message: `Puedes subir hasta ${MAX_FILES_PER_BATCH} archivos PDF por lote`,
    });
  }

  const accepted: PurchaseOrderMultipartPart[] = [];
  const rejected: PurchaseOrderRejectedFile[] = [];

  files.forEach((part, index) => {
    const filename = part.filename?.trim();
    const isPdf =
      part.type === 'application/pdf'
      || (filename?.toLowerCase().endsWith('.pdf') ?? false);

    if (!filename || !isPdf) {
      rejected.push({
        fileName: filename || `Archivo ${index + 1}`,
        reason: 'Solo se aceptan archivos PDF',
      });
      return;
    }
    if (part.data.byteLength === 0) {
      rejected.push({ fileName: filename, reason: 'El archivo está vacío' });
      return;
    }
    accepted.push(part);
  });

  if (accepted.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Selecciona únicamente archivos PDF',
    });
  }

  return { accepted, rejected };
}

export function purchaseOrderPartsToFormData(
  parts: PurchaseOrderMultipartPart[],
): FormData {
  const form = new FormData();
  for (const part of parts) {
    const bytes = new Uint8Array(part.data.byteLength);
    bytes.set(part.data);
    const blob = new Blob([bytes.buffer], { type: 'application/pdf' });
    form.append('files', blob, part.filename);
  }
  return form;
}

export function rejectedFilesToUploadResults(
  rejected: PurchaseOrderRejectedFile[],
): TmsPurchaseOrderUploadFile[] {
  return rejected.map((file) => ({
    fileName: file.fileName,
    orderNumber: null,
    url: null,
    extracted: false,
    error: file.reason,
  }));
}

function readString(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function normalizeUploadFile(
  value: unknown,
  fallbackName: string,
): TmsPurchaseOrderUploadFile {
  if (value == null || typeof value !== 'object') {
    return {
      fileName: fallbackName,
      orderNumber: null,
      url: null,
      extracted: false,
      error: 'El servicio devolvió un resultado ilegible para este archivo',
    };
  }

  const record = value as Record<string, unknown>;
  const orderNumber = readString(record, [
    'orderNumber',
    'order_number',
    'purchaseOrder',
    'purchase_order',
  ]);
  const normalized: TmsPurchaseOrderUploadFile = {
    fileName:
      readString(record, ['fileName', 'filename', 'file_name', 'name'])
      ?? fallbackName,
    orderNumber,
    url: readString(record, ['url', 'fileUrl', 'file_url', 'pdfUrl', 'link']),
    extracted: record.extracted === true || orderNumber != null,
  };

  const message = readString(record, ['message', 'status']);
  if (message) normalized.message = message;

  const error = readString(record, ['error', 'detail', 'reason']);
  if (error) normalized.error = error;

  return normalized;
}

function readUploadEntries(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (value == null || typeof value !== 'object') return null;

  for (const key of ['files', 'results', 'data']) {
    const candidate = (value as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return null;
}

/**
 * Agrega los archivos que el servicio no reportó, para que el usuario no se
 * quede sin feedback de un PDF que sí envió.
 */
function appendMissingResults(
  files: TmsPurchaseOrderUploadFile[],
  sentFileNames: string[],
): TmsPurchaseOrderUploadFile[] {
  if (files.length >= sentFileNames.length) return files;

  const returned = new Set(files.map((file) => file.fileName));
  const missing = sentFileNames
    .filter((name) => !returned.has(name))
    .map<TmsPurchaseOrderUploadFile>((name) => ({
      fileName: name,
      orderNumber: null,
      url: null,
      extracted: false,
      error: 'El servicio no devolvió resultado para este archivo',
    }));

  return [...files, ...missing];
}

export function normalizePurchaseOrderUploadResponse(
  value: unknown,
  options?: { sentFileNames?: string[] },
): TmsPurchaseOrderUploadResponse {
  const entries = readUploadEntries(value);
  if (!entries) {
    throw createError({
      statusCode: 502,
      message: 'Respuesta inválida del servicio de órdenes de compra',
    });
  }

  const sentFileNames = options?.sentFileNames ?? [];
  const files = entries.map((entry, index) =>
    normalizeUploadFile(entry, sentFileNames[index] ?? `Archivo ${index + 1}`),
  );

  return { files: appendMissingResults(files, sentFileNames) };
}

/**
 * Rescata los resultados por archivo cuando el servicio responde con un status
 * de error pero su cuerpo ya trae el detalle del lote.
 */
export function extractPurchaseOrderPartialResponse(
  error: unknown,
  options?: { sentFileNames?: string[] },
): TmsPurchaseOrderUploadResponse | null {
  const data =
    error && typeof error === 'object' && 'data' in error
      ? (error as { data: unknown }).data
      : undefined;

  const entries = readUploadEntries(data);
  if (!entries || entries.length === 0) return null;

  const { files } = normalizePurchaseOrderUploadResponse(data, options);
  const batchError =
    data && typeof data === 'object' && !Array.isArray(data)
      ? readString(data as Record<string, unknown>, ['detail', 'message', 'error'])
      : null;

  return {
    files,
    batchError:
      batchError
      ?? 'El servicio reportó errores en el lote, revisa el detalle por archivo',
  };
}
