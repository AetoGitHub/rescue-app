export const FILL_OC_API_PATH = '/api/nexxt-step/fill_oc/';

export const FILL_OC_QUERY_KEY = ['fill-oc'] as const;

export const FILL_OC_LABELS = {
  pageTitle: 'Llenar OC',
  pageDescription: 'Registra la orden de compra de los rescates pendientes.',
  empty: 'No hay rescates pendientes de OC.',
  inputLabel: 'Número de OC',
  inputPlaceholder: 'OC del cliente',
  saveButton: 'Guardar OC',
  successToast: 'Orden de compra guardada',
  errorToast: 'No se pudo guardar la OC',
} as const;
