import {
  RESCUE_EVIDENCE_PAYMENT_MAX_BYTES,
  RESCUE_EVIDENCE_SERVICE_MAX_BYTES,
  RESCUE_EVIDENCE_STORAGE_PREFIX,
  RESCUE_EVIDENCE_TYPE_SERVICE,
} from '~/constants/rescue-evidence-api';
import type { RescueEvidenceType } from '~/interfaces/rescue/evidence';

const SERVICE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'mp4',
  'webm',
  'mov',
  'pdf',
]);

const PAYMENT_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'pdf',
]);

function fileExtension(name: string): string {
  const parts = name.split('.');
  if (parts.length < 2) return '';
  return (parts.at(-1) ?? '').toLowerCase();
}

export function getRescueEvidenceMaxBytes(type: RescueEvidenceType): number {
  return type === RESCUE_EVIDENCE_TYPE_SERVICE
    ? RESCUE_EVIDENCE_SERVICE_MAX_BYTES
    : RESCUE_EVIDENCE_PAYMENT_MAX_BYTES;
}

export function isRescueEvidenceFileAllowed(
  file: File,
  type: RescueEvidenceType,
): boolean {
  const ext = fileExtension(file.name);
  const allowed =
    type === RESCUE_EVIDENCE_TYPE_SERVICE
      ? SERVICE_EXTENSIONS
      : PAYMENT_EXTENSIONS;
  if (!ext || !allowed.has(ext)) return false;
  return file.size <= getRescueEvidenceMaxBytes(type);
}

export function buildRescueEvidenceStoragePath(
  rescueId: number,
  type: RescueEvidenceType,
): string {
  const folder =
    type === RESCUE_EVIDENCE_TYPE_SERVICE ? 'services' : 'payment_provider';
  return `${RESCUE_EVIDENCE_STORAGE_PREFIX}/${rescueId}/${folder}`;
}

/** Webhook URL with literal slashes in `path` (n8n spec), not %2F from URLSearchParams. */
export function buildFirebaseGeneralUploadUrl(
  webhookUrl: string,
  storagePath: string,
): string {
  const base = webhookUrl.includes('?')
    ? webhookUrl.slice(0, webhookUrl.indexOf('?'))
    : webhookUrl;
  return `${base}?path=${storagePath}`;
}

export function extractUploadedFileUrl(response: unknown): string {
  if (typeof response === 'string' && response.startsWith('http')) {
    return response;
  }
  if (response == null || typeof response !== 'object') {
    throw new Error('Respuesta de subida sin URL');
  }

  const record = response as Record<string, unknown>;
  const direct =
    record.url ?? record.downloadURL ?? record.downloadUrl ?? record.fileUrl;
  if (typeof direct === 'string' && direct.startsWith('http')) {
    return direct;
  }

  const data = record.data;
  if (data != null && typeof data === 'object') {
    const nested = data as Record<string, unknown>;
    const nestedUrl =
      nested.url ?? nested.downloadURL ?? nested.downloadUrl ?? nested.fileUrl;
    if (typeof nestedUrl === 'string' && nestedUrl.startsWith('http')) {
      return nestedUrl;
    }
  }

  throw new Error('Respuesta de subida sin URL válida');
}

export async function uploadFileToFirebaseGeneral(
  file: File,
  storagePath: string,
  webhookUrl: string,
): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const uploadUrl = buildFirebaseGeneralUploadUrl(webhookUrl, storagePath);

  const response = await $fetch<unknown>(uploadUrl, {
    method: 'POST',
    body: form,
  });

  return extractUploadedFileUrl(response);
}

export function rescueEvidenceAcceptAttribute(
  type: RescueEvidenceType,
): string {
  return type === RESCUE_EVIDENCE_TYPE_SERVICE
    ? 'image/*,video/*,.pdf,application/pdf'
    : 'image/*,.pdf,application/pdf';
}

export function getRescueEvidenceFileIcon(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'i-lucide-file-text';
  if (/\.(mp4|webm|mov)(\?|$)/.test(lower)) return 'i-lucide-video';
  if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/.test(lower)) return 'i-lucide-image';
  return 'i-lucide-file';
}

export function downloadAllEvidenceUrls(urls: string[]) {
  for (const url of urls) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
