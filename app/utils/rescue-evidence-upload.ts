import {
  RESCUE_ADMIN_PAYMENT_STORAGE_FOLDER,
  RESCUE_EVIDENCE_PAYMENT_MAX_BYTES,
  RESCUE_EVIDENCE_SERVICE_MAX_BYTES,
  RESCUE_EVIDENCE_STORAGE_PREFIX,
  RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER,
  RESCUE_EVIDENCE_TYPE_SERVICE,
  rescueEvidenceZipComplement,
} from '~/constants/rescue-evidence-api';
import type {
  RescueEvidenceType,
  RescueEvidenceZipDownloadBody,
} from '~/interfaces/rescue/evidence';

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

export function buildAdministrativePaymentStoragePath(rescueId: number): string {
  return `${RESCUE_EVIDENCE_STORAGE_PREFIX}/${rescueId}/${RESCUE_ADMIN_PAYMENT_STORAGE_FOLDER}`;
}

export function isAdministrativePaymentFileAllowed(file: File): boolean {
  return isRescueEvidenceFileAllowed(file, RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER);
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

export type FirebaseUploadOptions = {
  onProgress?: (percent: number) => void;
};

export function computeMultiFileUploadProgress(
  fileIndex: number,
  totalFiles: number,
  filePercent: number,
): number {
  if (totalFiles <= 0) return 0;
  const normalized = Math.min(100, Math.max(0, filePercent));
  return Math.min(
    100,
    Math.round(((fileIndex + normalized / 100) / totalFiles) * 100),
  );
}

function uploadFileWithXhr(
  file: File,
  uploadUrl: string,
  onProgress?: (percent: number) => void,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
        return;
      }
      reject(new Error(`Error de subida (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('Error de red al subir el archivo'));

    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

export async function uploadFileToFirebaseGeneral(
  file: File,
  storagePath: string,
  webhookUrl: string,
  options: FirebaseUploadOptions = {},
): Promise<string> {
  const uploadUrl = buildFirebaseGeneralUploadUrl(webhookUrl, storagePath);

  const response =
    typeof XMLHttpRequest !== 'undefined'
      ? await uploadFileWithXhr(file, uploadUrl, options.onProgress)
      : await $fetch<unknown>(uploadUrl, {
          method: 'POST',
          body: (() => {
            const form = new FormData();
            form.append('file', file);
            return form;
          })(),
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

export function buildRescueEvidenceZipPayload(input: {
  rescueId: number;
  folio: string;
  type: RescueEvidenceType;
  urls: string[];
  complement?: string;
}): RescueEvidenceZipDownloadBody {
  return {
    rescue_id: input.rescueId,
    folio: input.folio,
    complement:
      input.complement ?? rescueEvidenceZipComplement(input.type),
    urls: input.urls.filter((url) => url.trim().length > 0),
  };
}

/**
 * Temporary: logs the zip payload. Replace the body with the real web
 * service call when the download-zip endpoint is ready.
 */
export async function requestRescueEvidenceZipDownload(
  body: RescueEvidenceZipDownloadBody,
): Promise<void> {
  // TODO(evidence-zip): POST body to the zip web service and trigger download.
  console.log('[rescue-evidence-zip]', body);
}

/** @deprecated Prefer requestRescueEvidenceZipDownload with the zip payload. */
export function downloadAllEvidenceUrls(urls: string[]) {
  for (const url of urls) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
