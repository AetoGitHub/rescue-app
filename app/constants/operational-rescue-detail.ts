export const RESCUE_DETAIL_TAB_ITEMS = [
  { label: 'General', value: 'general', slot: 'general' as const },
  { label: 'Evidencia', value: 'evidence', slot: 'evidence' as const },
  { label: 'Pago Proveedor', value: 'supplier_payment', slot: 'supplier_payment' as const },
  { label: 'Cotización', value: 'quote', slot: 'quote' as const },
  { label: 'Reporte PDF', value: 'pdf_report', slot: 'pdf_report' as const },
  { label: 'Agente Gestor', value: 'manager_agent', slot: 'manager_agent' as const },
] as const;

export type RescueDetailTabValue =
  (typeof RESCUE_DETAIL_TAB_ITEMS)[number]['value'];

export const RESCUE_ADMIN_STATUS_LABELS: Record<
  string,
  { label: string; color: 'error' | 'warning' | 'info' | 'neutral' }
> = {
  invalid: { label: 'Sin atender', color: 'error' },
  working: { label: 'Trabajando', color: 'info' },
  requires_human: { label: 'Requiere humano', color: 'warning' },
};

export const RESCUE_DETAIL_PLACEHOLDER_UNDEFINED = '— Sin definir —';
export const RESCUE_DETAIL_PLACEHOLDER_NO_DESCRIPTION = '— Sin descripción —';
export const RESCUE_DETAIL_PLACEHOLDER_NO_NOTES = '— Sin notas —';
export const RESCUE_DETAIL_PLACEHOLDER_UNASSIGNED = 'Sin asignar';
