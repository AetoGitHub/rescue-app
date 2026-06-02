/**
 * Admin billing workflow (`admin_status` on administrative cards API).
 * Query param: `status` (required). Not gestor `admin_status` on operational cards.
 */
export type AdministrativeBillingStatus =
  | 'invalid'
  | 'unattended'
  | 'in_remittance'
  | 'invoiced'
  | 'paid'
  | 'canceled'
  | 'warranty';

/** Service types accepted by GET /api/rescue/administrative/cards/ */
export const ADMINISTRATIVE_API_SERVICE_TYPES = ['rescue', 'loan'] as const;

export type AdministrativeApiServiceType =
  (typeof ADMINISTRATIVE_API_SERVICE_TYPES)[number];

export interface AdministrativeKanbanColumnDef {
  status: AdministrativeBillingStatus;
  title: string;
  accentColor: string;
}

export const ADMINISTRATIVE_KANBAN_COLUMNS: AdministrativeKanbanColumnDef[] = [
  { status: 'invalid', title: 'Inválido', accentColor: '#94a3b8' },
  { status: 'unattended', title: 'Sin atender', accentColor: '#38bdf8' },
  { status: 'in_remittance', title: 'En remisión', accentColor: '#22c55e' },
  { status: 'invoiced', title: 'Facturado', accentColor: '#8b5cf6' },
  { status: 'paid', title: 'Pagado', accentColor: '#14b8a6' },
  { status: 'warranty', title: 'Garantía', accentColor: '#eab308' },
  { status: 'canceled', title: 'Cancelado', accentColor: '#f43f5e' },
];

/** Kanban / default list status query — excludes `invalid` until product enables it. */
export const ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS =
  ADMINISTRATIVE_KANBAN_COLUMNS.filter((column) => column.status !== 'invalid');

/** Operative statuses eligible for the administrative board (client-side filter). */
export const ADMINISTRATIVE_ELIGIBLE_OPERATIVE_STATUSES = [
  'closed',
  'closed_unpaid',
  'warranty_pending',
] as const;

export type AdministrativeEligibleOperativeStatus =
  (typeof ADMINISTRATIVE_ELIGIBLE_OPERATIVE_STATUSES)[number];
