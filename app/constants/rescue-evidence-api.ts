import type { RescueEvidenceType } from '~/interfaces/rescue/evidence';

export const RESCUE_EVIDENCE_LIST_PATH = (rescueId: number) =>
  `/api/rescue/evidence/${rescueId}/`;

export const RESCUE_EVIDENCE_CREATE_PATH = (rescueId: number) =>
  `/api/rescue/evidence/${rescueId}/create/`;

export const RESCUE_EVIDENCE_TYPE_SERVICE = 'service' as const satisfies RescueEvidenceType;
export const RESCUE_EVIDENCE_TYPE_PAYMENT_PROVIDER =
  'payment_provider' as const satisfies RescueEvidenceType;

export const RESCUE_EVIDENCE_SERVICE_MAX_BYTES = 50 * 1024 * 1024;
export const RESCUE_EVIDENCE_PAYMENT_MAX_BYTES = 25 * 1024 * 1024;

export const RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT =
  'https://n8n.srv1137762.hstgr.cloud/webhook/upload-firebase-general';

export const RESCUE_EVIDENCE_STORAGE_PREFIX = 'rescue-2/rescue';

/** Administrative client payment evidence (change_admin_status), not provider evidence. */
export const RESCUE_ADMIN_PAYMENT_STORAGE_FOLDER = 'payment_client';

export const RESCUE_EVIDENCE_MODAL_COPY = {
  service: {
    title: (folio: string) => `Evidencia del Servicio ${folio}`,
    subtitle: 'Fotos, videos o PDFs (máx 50MB c/u)',
    dropzoneLabel: 'Arrastra archivos aquí o haz clic para seleccionar',
    empty:
      'Aún no hay evidencia subida. Arrastra o selecciona fotos, videos o PDFs arriba.',
    fileCountLabel: (count: number) =>
      `${count} archivo${count === 1 ? '' : 's'}`,
    uploadSuccess: 'Evidencia guardada',
    invalidFile: 'Solo imágenes, videos o PDF dentro del tamaño máximo',
  },
  payment_provider: {
    title: (folio: string) => `Pago a Proveedor – ${folio}`,
    subtitle:
      'Comprobante de transferencia (imágenes o PDF, máx 25MB c/u). Requerido para cerrar.',
    dropzoneLabel:
      'Arrastra el comprobante aquí o haz clic para seleccionar',
    empty:
      'Aún no hay comprobante. Arrastra o selecciona la captura o PDF arriba.',
    fileCountLabel: (count: number) =>
      `${count} comprobante${count === 1 ? '' : 's'}`,
    uploadSuccess: 'Comprobante guardado',
    invalidFile: 'Solo imágenes o PDF dentro del tamaño máximo',
  },
  admin_payment: {
    dropzoneDescription: 'PDF o imagen del comprobante (máx 25MB)',
    uploadSuccess: 'Comprobante subido correctamente',
    uploadSuccessHint: 'Ya puedes aplicar el pago.',
    invalidFile: 'Solo imágenes o PDF dentro del tamaño máximo',
  },
  downloadAll: 'Descargar todo',
  uploading: 'Subiendo…',
  upload: 'Subir',
  close: 'Cerrar',
  uploadError: 'No se pudo subir la evidencia',
} as const;
