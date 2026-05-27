import { OPERATIONAL_KANBAN_COLUMNS } from '~/constants/operational-kanban';
import { RESCUE_SERVICE_TYPE_OPTIONS } from '~/constants/rescue-select-options';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { SlaAlertLevelConfig, SlaDurationUnit } from '~/interfaces/sla';

export const SLA_API_PATHS = {
  stages: '/api/sla/stages/',
  alertLevels: '/api/sla/alert-levels/',
  chatIdleAlerts: '/api/sla/chat-idle-alerts/',
} as const;

export const SLA_SERVICE_TYPES: RescueServiceType[] = [
  'rescue',
  'loan',
  'direct_budget',
  'proyect',
];

export const SLA_OPERATIONAL_STATUS_OPTIONS = OPERATIONAL_KANBAN_COLUMNS.filter(
  (column) =>
    column.status !== 'requested' && column.status !== 'canceled',
).map((column) => ({
  label: column.title,
  value: column.status as OperationalRescueStatus,
}));

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

export const SLA_DEFAULT_ALERT_LEVELS: Omit<
  SlaAlertLevelConfig,
  'id'
>[] = [
  {
    name: 'Aviso',
    threshold_percent: 70,
    color: '#22c55e',
    is_active: true,
    notify_assigned_manager: true,
    notify_admin: false,
    notify_direction: false,
  },
  {
    name: 'Urgente',
    threshold_percent: 100,
    color: '#f59e0b',
    is_active: true,
    notify_assigned_manager: true,
    notify_admin: true,
    notify_direction: false,
  },
  {
    name: 'Crítico',
    threshold_percent: 150,
    color: '#ef4444',
    is_active: true,
    notify_assigned_manager: true,
    notify_admin: true,
    notify_direction: true,
  },
];

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
  { label: 'Gestor asignado', key: 'notify_assigned_manager' as const },
  { label: 'Admin', key: 'notify_admin' as const },
  { label: 'Dirección', key: 'notify_direction' as const },
];

export type SlaConfigTabValue = (typeof SLA_TAB_ITEMS)[number]['value'];
