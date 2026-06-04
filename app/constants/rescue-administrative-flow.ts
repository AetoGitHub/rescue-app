import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import { BILLING_TYPE_OPTIONS } from '~/constants/catalog-select-options';

export type AdminClientType = 'CREDIT' | 'CASH' | 'PUBLIC';

export type ClientBillingType = (typeof BILLING_TYPE_OPTIONS)[number]['value'];

const CLIENT_BILLING_TYPE_SET = new Set<string>(
  BILLING_TYPE_OPTIONS.map((option) => option.value),
);

export function normalizeClientBillingType(
  value: string | null | undefined,
): ClientBillingType {
  const upper = (value ?? '').trim().toUpperCase();
  if (CLIENT_BILLING_TYPE_SET.has(upper)) {
    return upper as ClientBillingType;
  }
  return 'DIRECT_INVOICE';
}

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
  ClientBillingType,
  AdministrativeBillingStatus[]
> = {
  DIRECT_INVOICE: ['unattended', 'invoiced', 'paid'],
  REMISSION: ['unattended', 'in_remittance', 'invoiced', 'paid'],
  MANUAL: ['unattended', 'in_remittance', 'invoiced', 'paid'],
};

const ADMIN_FLOW_SHARED: Partial<
  Record<AdministrativeBillingStatus, AdministrativeBillingStatus[]>
> = {
  in_remittance: ['invoiced', 'warranty', 'canceled'],
  invoiced: ['paid', 'warranty', 'canceled'],
  paid: ['warranty'],
  canceled: [],
};

/** Allowed `to` targets per client billing mode and current billing status. */
export const ADMIN_BILLING_FLOWS: Record<
  ClientBillingType,
  Partial<Record<AdministrativeBillingStatus, AdministrativeBillingStatus[]>>
> = {
  DIRECT_INVOICE: {
    unattended: ['invoiced', 'canceled'],
    ...ADMIN_FLOW_SHARED,
    warranty: ['unattended', 'invoiced', 'paid'],
  },
  REMISSION: {
    unattended: ['in_remittance', 'canceled'],
    ...ADMIN_FLOW_SHARED,
    warranty: ['unattended', 'in_remittance', 'invoiced', 'paid'],
  },
  MANUAL: {
    unattended: ['in_remittance', 'invoiced', 'canceled'],
    ...ADMIN_FLOW_SHARED,
    warranty: ['unattended', 'in_remittance', 'invoiced', 'paid'],
  },
};

export const RESCUE_ADMINISTRATIVE_MANUAL_BILLING_ALERT = {
  title: 'Modo manual',
  description:
    'Se recomienda emitir remisión primero. También puedes pasar a facturado con los datos de factura.',
} as const;

export const RESCUE_ADMINISTRATIVE_REMISSION_REQUIRED_ALERT = {
  title: 'Requiere remisión',
  description: 'Debes emitir remisión antes de facturar.',
} as const;

/** @deprecated Use RESCUE_ADMINISTRATIVE_MANUAL_BILLING_ALERT */
export const RESCUE_ADMINISTRATIVE_REMISSION_ALERT =
  RESCUE_ADMINISTRATIVE_MANUAL_BILLING_ALERT;
