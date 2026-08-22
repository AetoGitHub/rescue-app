export const FILL_OC_API_PATH = '/api/nexxt-step/fill_oc/';

export const FILL_OC_API_KEY_HEADER = 'x-api-key';

export const FILL_OC_QUERY_KEY = ['fill-oc'] as const;

export const FILL_OC_POLL_INTERVAL_MS = 30_000;

export const FILL_OC_AUTH_TOKEN_API_PATH = '/api/auth/api-key/token/';

export const FILL_OC_STAFF_PROXY_PREFIX = '/api/fill-oc/staff';

/** Query `key` de preview local. En producción el backend las rechaza. */
export const FILL_OC_MOCK_KEY = {
  list: 'mock',
  unauthorized: 'mock-unauthorized',
  empty: 'mock-empty',
  error: 'mock-error',
} as const;

export type FillOcMockKey = (typeof FILL_OC_MOCK_KEY)[keyof typeof FILL_OC_MOCK_KEY];

/** Tiempo que la tarjeta muestra el check antes de desaparecer. */
export const FILL_OC_SAVED_HOLD_MS = 1_200;

export const FILL_OC_LABELS = {
  pageTitle: 'Llenar OC',
  pageDescription: 'Registra la orden de compra de los rescates pendientes.',
  empty: 'No hay rescates pendientes de OC.',
  emptyDescription: 'Todos los rescates ya tienen su orden de compra.',
  inputLabel: 'Número de OC',
  inputPlaceholder: 'OC del cliente',
  saveButton: 'Guardar OC',
  savedBadge: 'OC guardada',
  successToast: 'Orden de compra guardada',
  errorToast: 'No se pudo guardar la OC',
  searchPlaceholder: 'Buscar folio, responsable, unidad…',
  noSearchResults: 'Sin coincidencias',
  noSearchResultsDescription: 'Prueba con otro folio o limpia la búsqueda.',
  evidenceLabel: 'Descargar evidencia de rescate',
  evidenceEmpty: 'No hay archivos para descargar',
  commentsTitle: 'Abrir chat del rescate',
  missingKeyTitle: 'Falta la clave de acceso',
  missingKeyDescription:
    'Abre el enlace completo que recibiste; debe incluir el parámetro «key».',
  unauthorizedTitle: 'Acceso no autorizado',
  unauthorizedDescription:
    'La clave del enlace no es válida o ya expiró. Solicita un enlace nuevo.',
  loadErrorTitle: 'No se pudo cargar la lista',
  retryButton: 'Reintentar',
  pendingCount: 'pendientes',
  pendingCountSingular: 'pendiente',
} as const;
