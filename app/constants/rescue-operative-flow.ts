import type { RescueAdvancePanelMode } from '~/interfaces/rescue/operative';

/** Phase transitions: POST /api/rescue/change_phase/{rescue_pk}/ */
export const RESCUE_OPERATIVE_UPDATE_METHOD = 'POST' as const;

export const RESCUE_CHANGE_PHASE_PATH = (rescueId: number) =>
  `/api/rescue/change_phase/${rescueId}/`;

export const RESCUE_REVERT_CANCELLATION_PATH = (rescueId: number) =>
  `/api/rescue/revert_cancellation/${rescueId}/`;

/** @deprecated Use RESCUE_CHANGE_PHASE_PATH */
export const RESCUE_OPERATIVE_UPDATE_PATH = RESCUE_CHANGE_PHASE_PATH;

export const RESCUE_OPERATIVE_TOAST = {
  quoteRequired:
    'Debes crear una cotización antes de enviar a autorización',
  evidenceServiceRequired:
    'Sube evidencia del servicio antes de cerrar',
  advanceAmountRequired: 'El monto del anticipo debe ser mayor a $0',
  advanceConfirmRequired:
    'Completa monto, fecha, forma de pago y referencia del anticipo',
  operativeUpdated: 'Solicitud actualizada',
  cancellationReverted: 'Cancelación revertida',
  advanceRequested: 'Anticipo solicitado',
  advanceModified: 'Monto de anticipo actualizado',
  advanceConfirmed: 'Anticipo confirmado',
  advanceApprovedWithout: 'Solicitud aprobada sin anticipo',
} as const;

export const RESCUE_ADVANCE_PANEL_COPY = {
  configureTitle: 'Configurar anticipo',
  amountLabel: 'Monto del anticipo:',
  amountHelper:
    'Monto que debe pagar el cliente antes de iniciar el servicio',
  confirmRequest: 'Confirmar anticipo',
  confirmModify: 'Guardar cambios',
  confirmReceived: 'Confirmar anticipo recibido',
  confirmApproveWithout: 'Confirmar',
  approveWithoutMessage:
    '¿Confirmas aprobar esta solicitud sin solicitar anticipo al cliente?',
} as const;

export function formatAdvanceQuickCalcLabel(formattedTotal: string): string {
  return `Cálculo rápido sobre cotización (${formattedTotal}):`;
}

export const RESCUE_ADVANCE_NO_QUOTE_WARNING =
  'Captura primero la cotización para usar cálculo por %';

/** TBD — admin notification when requesting advance (if not handled by card POST). */
// export const RESCUE_NOTIFY_ADMINS_PATH = '/api/...';

export const RESCUE_OPERATIVE_BUTTON_LABELS = {
  sendToAuthorization: 'Enviar a Autorización',
  cancelService: 'Cancelar servicio',
  approveLoan: 'Aprobar préstamo',
  creditExceeded: 'Excede crédito disponible — no se puede aprobar',
  requestAdvance: 'Solicitar anticipo',
  approveWithoutAdvance: 'Aprobar sin anticipo',
  confirmAdvanceReceived: 'Confirmar anticipo recibido',
  modifyAdvanceAmount: 'Modificar monto',
  cancelAdvance: 'Cancelar anticipo',
  completeService: 'Servicio completado',
  confirmDisbursement: 'Confirmar desembolso',
  startProject: 'Iniciar proyecto',
  completeProject: 'Proyecto completado',
  takeRequest: 'Tomar solicitud',
  markAsClosed: 'Marcar como cerrado',
  revertCancellation: 'Revertir cancelación',
} as const;

export const RESCUE_ADVANCE_PERCENT_SHORTCUTS = [25, 50, 75, 100] as const;

export const RESCUE_PAYMENT_METHOD_OPTIONS = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Transferencia', value: 'transfer' },
  { label: 'Tarjeta', value: 'card' },
  { label: 'Cheque', value: 'check' },
  { label: 'Otro', value: 'other' },
] as const;

export type RescuePaymentMethod =
  (typeof RESCUE_PAYMENT_METHOD_OPTIONS)[number]['value'];

export const RESCUE_ADVANCE_PANEL_TITLES: Record<RescueAdvancePanelMode, string> = {
  request: 'Solicitar anticipo',
  approve_without: 'Aprobar sin anticipo',
  confirm: 'Confirmar anticipo recibido',
  modify: 'Modificar monto de anticipo',
};

export const RESCUE_SERVICE_COMPLETED_PANEL_TITLE = 'Cerrar servicio';
