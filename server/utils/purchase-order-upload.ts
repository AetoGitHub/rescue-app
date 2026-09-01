import { joinURL } from 'ufo';
import { QUOTE_PDF_API_DEFAULT } from '~/constants/quote-pdf-api';
import {
  PURCHASE_ORDER_JOB_SEGMENT,
  PURCHASE_ORDER_UPLOAD_SEGMENT,
  TMS_PURCHASE_ORDER_MAX_FILE_BYTES,
  TMS_PURCHASE_ORDER_MAX_FILES,
} from '~/constants/tms-portal-api';
import type {
  TmsPurchaseOrderJob,
  TmsPurchaseOrderJobAccepted,
  TmsPurchaseOrderJobStatus,
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

export function buildPurchaseOrderUploadUrl(baseUrl: string): string {
  return joinURL(baseUrl.trim() || QUOTE_PDF_API_DEFAULT, PURCHASE_ORDER_UPLOAD_SEGMENT);
}

export function resolvePurchaseOrderUploadUrl(): string {
  return buildPurchaseOrderUploadUrl(resolveQuotePdfApiUrl());
}

export function buildPurchaseOrderJobUrl(baseUrl: string, jobId: string): string {
  return joinURL(
    baseUrl.trim() || QUOTE_PDF_API_DEFAULT,
    `${PURCHASE_ORDER_JOB_SEGMENT}/${jobId}`,
  );
}

export function resolvePurchaseOrderJobUrl(jobId: string): string {
  return buildPurchaseOrderJobUrl(resolveQuotePdfApiUrl(), jobId);
}

export function assertPurchaseOrderJobId(raw: string | undefined): string {
  const jobId = raw?.trim() ?? '';
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(jobId)) {
    throw createError({
      statusCode: 400,
      message: 'Identificador de trabajo inválido',
    });
  }
  return jobId;
}

/**
 * Valida el lote antes de reenviarlo al servicio de PDFs. Un archivo inválido
 * aborta el POST para que el job.total coincida con lo que el usuario envió.
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
  if (files.length > TMS_PURCHASE_ORDER_MAX_FILES) {
    throw createError({
      statusCode: 400,
      message: `Puedes subir hasta ${TMS_PURCHASE_ORDER_MAX_FILES} archivos PDF`,
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
    if (part.data.byteLength > TMS_PURCHASE_ORDER_MAX_FILE_BYTES) {
      rejected.push({
        fileName: filename,
        reason: 'Cada PDF debe pesar 10 MB o menos',
      });
      return;
    }
    accepted.push(part);
  });

  if (rejected.length > 0) {
    throw createError({
      statusCode: 400,
      message: rejected[0]?.reason ?? 'Selecciona únicamente archivos PDF',
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

function readNumber(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
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

export function normalizePurchaseOrderJobAccepted(
  value: unknown,
): TmsPurchaseOrderJobAccepted {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({
      statusCode: 502,
      message: 'Respuesta inválida del servicio de órdenes de compra',
    });
  }

  const record = value as Record<string, unknown>;
  const jobId = readString(record, ['jobId', 'job_id', 'id']);
  const total = readNumber(record, ['total']);

  if (!jobId || total == null || total < 0) {
    throw createError({
      statusCode: 502,
      message: 'Respuesta inválida del servicio de órdenes de compra',
    });
  }

  return { jobId, total };
}

function normalizeJobStatus(value: unknown): TmsPurchaseOrderJobStatus {
  if (value === 'pending' || value === 'processing' || value === 'done') {
    return value;
  }
  return 'processing';
}

export function normalizePurchaseOrderJob(value: unknown): TmsPurchaseOrderJob {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({
      statusCode: 502,
      message: 'Respuesta inválida del trabajo de órdenes de compra',
    });
  }

  const record = value as Record<string, unknown>;
  const jobId = readString(record, ['jobId', 'job_id', 'id']);
  const total = readNumber(record, ['total']);
  const completed = readNumber(record, ['completed']);

  if (!jobId || total == null) {
    throw createError({
      statusCode: 502,
      message: 'Respuesta inválida del trabajo de órdenes de compra',
    });
  }

  const entries = readUploadEntries(record.files) ?? [];
  const files = entries.map((entry, index) =>
    normalizeUploadFile(entry, `Archivo ${index + 1}`),
  );

  return {
    jobId,
    status: normalizeJobStatus(record.status),
    total,
    completed: completed ?? files.length,
    files,
  };
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
