import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';

export const RESCUE_ADMINISTRATIVE_CARDS_PATH =
  '/api/rescue/administrative/cards/';

export const RESCUE_ADMINISTRATIVE_DETAIL_PATH = (rescueId: number) =>
  `/api/rescue/administrative/cards/${rescueId}/`;

export const RESCUE_ADMINISTRATIVE_CHANGE_PHASE_PATH = (rescueId: number) =>
  `/api/rescue/administrative/change_phase/${rescueId}/`;

export const RESCUE_ADMINISTRATIVE_UPDATE_METHOD = 'POST' as const;

export const RESCUE_ADMINISTRATIVE_TOAST = {
  updated: 'Solicitud administrativa actualizada',
  purchaseOrderRequired:
    'Registra la orden de compra del cliente antes de facturar',
  documentComingSoon: 'Envío de documento disponible próximamente',
  endpointPending: 'El servicio administrativo aún no está disponible',
} as const;

export const RESCUE_ADMINISTRATIVE_BUTTON_LABELS = {
  issueRemittance: 'Emitir remisión',
  skipToInvoiced: 'Pasar a facturado',
  registerInvoice: 'Registrar factura',
  applyPayment: 'Aplicar pago',
  adminCancel: 'Cancelar administrativamente',
  openWarranty: 'Abrir garantía',
  savePurchaseOrder: 'Guardar OC',
} as const;

export const ADMINISTRATIVE_LINEAR_STEPS: Record<
  string,
  AdministrativeBillingStatus[]
> = {
  CREDIT: ['unattended', 'in_remittance', 'invoiced', 'paid'],
  CASH: ['unattended', 'invoiced', 'paid'],
  PUBLIC: ['unattended', 'invoiced', 'paid'],
};

export const RESCUE_ADMINISTRATIVE_REMISSION_ALERT = {
  title: 'Requiere remisión',
  description:
    'No puede facturarse directo. Primero emite remisión.',
} as const;
