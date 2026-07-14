import { OPERATIONAL_KANBAN_COLUMNS } from '~/constants/operational-kanban';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { SlaDurationUnit } from '~/interfaces/sla';

export const SLA_API_PATHS = {
  timePerStage: {
    list: '/api/sla/list/',
    create: '/api/sla/create/',
    update: (id: number) => `/api/sla/update/${id}/`,
  },
  levelAlert: {
    list: '/api/sla/level_alert/list/',
    create: '/api/sla/level_alert/create/',
    update: (id: number) => `/api/sla/level_alert/update/${id}/`,
  },
  updateChat: {
    list: '/api/sla/update_chat/list/',
    create: '/api/sla/update_chat/create/',
    update: (id: number) => `/api/sla/update_chat/update/${id}/`,
  },
} as const;

export const SLA_SERVICE_TYPES: RescueServiceType[] = [
  'rescue',
  'loan',
  'direct_budget',
  'proyect',
];

export const SLA_ALL_STATUS_OPTIONS = OPERATIONAL_KANBAN_COLUMNS.filter(
  (column) =>
    column.status !== 'canceled' && column.status !== 'closed',
).map((column) => ({
  label: column.title,
  value: column.status as OperationalRescueStatus,
}));

/** @deprecated use SLA_ALL_STATUS_OPTIONS — kept for chat tab excluding requested */
export const SLA_OPERATIONAL_STATUS_OPTIONS = SLA_ALL_STATUS_OPTIONS.filter(
  (option) => option.value !== 'requested',
);

export const SLA_PORTAL_FROM_STATUS: OperationalRescueStatus = 'requested';

export const SLA_DURATION_UNITS: {
  label: string;
  value: SlaDurationUnit;
}[] = [
  { label: 'Minutos', value: 'minutes' },
  { label: 'Horas', value: 'hours' },
  { label: 'Días', value: 'days' },
];

export const SLA_REQUEST_TYPE_META: Record<
  RescueServiceType,
  {
    label: string;
    icon: string;
    badgeColor: 'info' | 'primary' | 'secondary' | 'warning';
    accentHex: string;
    note: string | null;
  }
> = {
  rescue: {
    label: 'Rescate',
    icon: 'i-lucide-truck',
    badgeColor: 'info',
    accentHex: '#0ea5e9',
    note: null,
  },
  loan: {
    label: 'Préstamo',
    icon: 'i-lucide-landmark',
    badgeColor: 'primary',
    accentHex: '#8b5cf6',
    note: 'El préstamo inicia en Pendiente de autorizar.',
  },
  direct_budget: {
    label: 'Cotización directa',
    icon: 'i-lucide-file-text',
    badgeColor: 'secondary',
    accentHex: '#6366f1',
    note: null,
  },
  proyect: {
    label: 'Proyecto',
    icon: 'i-lucide-briefcase',
    badgeColor: 'warning',
    accentHex: '#f59e0b',
    note: null,
  },
};

export function getSlaRequestTypeLabel(serviceType: RescueServiceType): string {
  return (
    SLA_REQUEST_TYPE_META[serviceType]?.label ??
    RESCUE_SERVICE_TYPE_OPTIONS.find((o) => o.value === serviceType)?.label ??
    serviceType
  );
}

export const SLA_TAB_ITEMS = [
  {
    label: 'Etapas y tiempos',
    icon: 'i-lucide-timer',
    slot: 'stages' as const,
    value: 'stages',
  },
  {
    label: 'Niveles de alerta',
    icon: 'i-lucide-bell',
    slot: 'alerts' as const,
    value: 'alerts',
  },
  {
    label: 'Actualizaciones de chat',
    icon: 'i-lucide-message-square',
    slot: 'chat' as const,
    value: 'chat',
  },
];

export const SLA_ALERT_NOTIFY_OPTIONS = [
  { label: 'Gestor asignado', key: 'notify_gestor' as const },
  { label: 'Admin', key: 'notify_admin' as const },
  { label: 'Dirección', key: 'notify_direccion' as const },
];

export type SlaConfigTabValue = (typeof SLA_TAB_ITEMS)[number]['value'];
