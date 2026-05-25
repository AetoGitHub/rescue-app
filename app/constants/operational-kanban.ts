export type OperationalRescueStatus =
  | 'requested'
  | 'active_without_quote'
  | 'pending_authorization'
  | 'waiting_advance_payment'
  | 'approved'
  | 'in_progress'
  | 'closed_unpaid'
  | 'closed'
  | 'warranty_pending'
  | 'canceled';

export interface OperationalKanbanColumnDef {
  status: OperationalRescueStatus;
  title: string;
  /** Hex color for column top border and dropdown leading dot. */
  accentColor: string;
}

export const OPERATIONAL_KANBAN_COLUMNS: OperationalKanbanColumnDef[] = [
  { status: 'requested', title: 'Solicitado', accentColor: '#6366f1' },
  {
    status: 'active_without_quote',
    title: 'Activo sin cotizar',
    accentColor: '#0ea5e9',
  },
  {
    status: 'pending_authorization',
    title: 'Pendiente de autorizar',
    accentColor: '#8b5cf6',
  },
  {
    status: 'waiting_advance_payment',
    title: 'Esperando anticipo',
    accentColor: '#f59e0b',
  },
  { status: 'approved', title: 'Aprobado', accentColor: '#22c55e' },
  { status: 'in_progress', title: 'En proceso', accentColor: '#10b981' },
  {
    status: 'closed_unpaid',
    title: 'Cerrado no pagado',
    accentColor: '#f97316',
  },
  { status: 'closed', title: 'Cerrado', accentColor: '#14b8a6' },
  {
    status: 'warranty_pending',
    title: 'Garantía pendiente',
    accentColor: '#ec4899',
  },
  { status: 'canceled', title: 'Cancelado', accentColor: '#f43f5e' },
];
