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

export function buildPurchaseOrderUploadUrl(baseUrl: string): string {
  return joinURL(baseUrl.trim() || QUOTE_PDF_API_DEFAULT, '/purchase-orders/upload');
}

export function resolvePurchaseOrderUploadUrl(): string {
  return buildPurchaseOrderUploadUrl(resolveQuotePdfApiUrl());
}

export function parsePurchaseOrderPdfParts(
  parts: PurchaseOrderMultipartPart[] | undefined,
): PurchaseOrderMultipartPart[] {
  const files = (parts ?? []).filter((part) => part.name === 'files');

  if (files.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Selecciona al menos un archivo PDF',
    });
  }
  if (files.length > 20) {
    throw createError({
      statusCode: 400,
      message: 'Puedes subir hasta 20 archivos PDF por lote',
    });
  }

  const invalid = files.some((part) => {
    const filename = part.filename?.toLowerCase() ?? '';
    return (
      !part.filename
      || (part.type !== 'application/pdf' && !filename.endsWith('.pdf'))
    );
  });
  if (invalid) {
    throw createError({
      statusCode: 400,
      message: 'Selecciona únicamente archivos PDF',
    });
  }

  return files;
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

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function normalizeUploadFile(value: unknown): TmsPurchaseOrderUploadFile | null {
  if (value == null || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.fileName !== 'string' || !record.fileName.trim()) return null;

  const normalized: TmsPurchaseOrderUploadFile = {
    fileName: record.fileName,
    orderNumber: nullableString(record.orderNumber),
    url: nullableString(record.url),
    extracted: record.extracted === true,
  };
  if (typeof record.message === 'string') normalized.message = record.message;
  if (typeof record.error === 'string') normalized.error = record.error;
  return normalized;
}

export function normalizePurchaseOrderUploadResponse(
  value: unknown,
): TmsPurchaseOrderUploadResponse {
  if (value == null || typeof value !== 'object') {
    throw createError({
      statusCode: 502,
      message: 'Respuesta inválida del servicio de órdenes de compra',
    });
  }

  const files = (value as { files?: unknown }).files;
  if (!Array.isArray(files)) {
    throw createError({
      statusCode: 502,
      message: 'Respuesta inválida del servicio de órdenes de compra',
    });
  }

  const normalized = files.map(normalizeUploadFile);
  if (normalized.some((file) => file == null)) {
    throw createError({
      statusCode: 502,
      message: 'Respuesta inválida del servicio de órdenes de compra',
    });
  }

  return { files: normalized as TmsPurchaseOrderUploadFile[] };
}
