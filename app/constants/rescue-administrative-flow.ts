import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';

export type AdminClientType = 'CREDIT' | 'CASH' | 'PUBLIC';

export const RESCUE_ADMINISTRATIVE_CARDS_PATH =
  '/api/rescue/administrative/cards/';

export const RESCUE_ADMINISTRATIVE_DETAIL_PATH = (rescueId: number) =>
  `/api/rescue/administrative/cards/${rescueId}/`;

/** Phase transitions (billing workflow). */
export const RESCUE_CHANGE_ADMIN_STATUS_PATH = (rescueId: number) =>
  `/api/rescue/change_admin_status/${rescueId}/`;

/** @deprecated OC save until backend confirms new contract */
export const RESCUE_ADMINISTRATIVE_CHANGE_PHASE_PATH = (rescueId: number) =>
  `/api/rescue/administrative/change_phase/${rescueId}/`;

export const RESCUE_ADMINISTRATIVE_REVERT_CANCELLATION_PATH = (
  rescueId: number,
) => `/api/rescue/administrative/revert_cancellation/${rescueId}/`;

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
  adminCancel: 'Cancelar',
  openWarranty: 'Abrir Garantía administrativa',
  savePurchaseOrder: 'Guardar OC',
  revertAdminCancellation: 'Revertir cancelación administrativa',
} as const;

export const ADMINISTRATIVE_LINEAR_STEPS: Record<
  AdminClientType,
  AdministrativeBillingStatus[]
> = {
  CREDIT: ['unattended', 'in_remittance', 'invoiced', 'paid'],
  CASH: ['unattended', 'invoiced', 'paid'],
  PUBLIC: ['unattended', 'invoiced', 'paid'],
};

/** Allowed `to` targets per client type and current billing status. */
export const ADMIN_BILLING_FLOWS: Record<
  AdminClientType,
  Partial<Record<AdministrativeBillingStatus, AdministrativeBillingStatus[]>>
> = {
  CREDIT: {
    unattended: ['in_remittance', 'invoiced', 'canceled'],
    in_remittance: ['invoiced', 'warranty', 'canceled'],
    invoiced: ['paid', 'warranty', 'canceled'],
    paid: ['warranty'],
    warranty: ['unattended', 'in_remittance', 'invoiced', 'paid'],
    canceled: [],
  },
  CASH: {
    unattended: ['invoiced', 'canceled'],
    in_remittance: ['invoiced', 'warranty', 'canceled'],
    invoiced: ['paid', 'warranty', 'canceled'],
    paid: ['warranty'],
    warranty: ['unattended', 'invoiced', 'paid'],
    canceled: [],
  },
  PUBLIC: {
    unattended: ['invoiced', 'canceled'],
    in_remittance: ['invoiced', 'canceled'],
    invoiced: ['paid', 'canceled'],
    paid: [],
    warranty: [],
    canceled: [],
  },
};

export const RESCUE_ADMINISTRATIVE_REMISSION_ALERT = {
  title: 'Requiere remisión',
  description:
    'Se recomienda emitir remisión primero. También puedes pasar a facturado con los datos de factura.',
} as const;
