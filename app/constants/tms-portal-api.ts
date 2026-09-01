export const TMS_RESCUE_LIST_PATH = '/api/invoicing/client_portal/tms/rescues/';
export const TMS_RESCUE_UPDATE_PATH = '/api/invoicing/client_portal/tms/rescues/';
export const TMS_RESCUE_TRIGGER_PATH = '/api/invoicing/client_portal/tms/trigger/';
export const TMS_PURCHASE_ORDER_UPLOAD_PATH =
  '/api/portals/tms/purchase-orders/upload';
export const TMS_PURCHASE_ORDER_JOB_PATH_PREFIX =
  '/api/portals/tms/purchase-orders/jobs';
export const TMS_RESCUE_LIST_QUERY_KEY = ['portal-tms-rescues'] as const;

/** Upstream PDF API path segments (same host as `NUXT_QUOTE_PDF_API_URL`). */
export const PURCHASE_ORDER_UPLOAD_SEGMENT = '/purchase-orders/upload';
export const PURCHASE_ORDER_JOB_SEGMENT = '/purchase-orders/jobs';

export const TMS_PURCHASE_ORDER_MAX_FILES = 100;
export const TMS_PURCHASE_ORDER_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const TMS_PURCHASE_ORDER_POLL_INTERVAL_MS = 1500;
export const TMS_PURCHASE_ORDER_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;
export const TMS_PURCHASE_ORDER_JOB_STORAGE_KEY = 'tms-purchase-order-job-id';
export const TMS_PURCHASE_ORDER_JOB_NOTIFIED_KEY =
  'tms-purchase-order-job-notified';

export function tmsPurchaseOrderJobPath(jobId: string): string {
  return `${TMS_PURCHASE_ORDER_JOB_PATH_PREFIX}/${encodeURIComponent(jobId)}`;
}

/** Nombre/etiqueta del cliente TMS. No usar el id: puede cambiar. */
export const TMS_CLIENT_LABEL = 'TMS';
