import type { RescueAdvancePanelMode } from '~/interfaces/rescue/operative';

/** Adjust method/path when backend contract is confirmed. */
export const RESCUE_OPERATIVE_UPDATE_METHOD = 'PATCH' as const;

export const RESCUE_OPERATIVE_UPDATE_PATH = (id: number) =>
  `/api/rescue/cards/${id}/`;

export const RESCUE_OPERATIVE_TOAST = {
  quoteRequired:
    'Debes crear una cotización antes de enviar a autorización',
  advanceAmountRequired: 'El monto de anticipo debe ser mayor a cero',
  advanceConfirmRequired:
    'Completa monto, fecha, forma de pago y referencia del anticipo',
  clientNotified: 'Cliente notificado',
  operativeUpdated: 'Solicitud actualizada',
} as const;

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
