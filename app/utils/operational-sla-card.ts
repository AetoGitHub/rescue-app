import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueCard, RescueServiceType  } from '~/interfaces/rescue';
import type { RescueGeneralSettings } from '~/interfaces/rescue/settings';
import type {
  SlaLevelAlertConfig,
  SlaTimePerStage,
  SlaUpdateChatConfig,
} from '~/interfaces/sla';

import { formatElapsedDuration, formatElapsedSince } from '~/utils/operational-rescue-card';
import { getOperationalStatusLabel } from '~/utils/operational-rescue-detail';
import {
  displayToMinutes,
  formatSlaTimePreview,
} from '~/utils/sla-duration';

export type OperationalBadgeColor =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error';

export interface OperationalChatBadgeState {
  label: string;
  color: OperationalBadgeColor;
  tooltip: string;
}

export interface OperationalSlaBadgeState {
  label: string;
  color: OperationalBadgeColor;
  customStyle: Record<string, string> | undefined;
  tooltip: string;
}

function elapsedMinutesSince(
  isoDate: string | null | undefined,
  nowMs: number,
): number | null {
  if (!isoDate) return null;

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  return Math.max(0, Math.floor((nowMs - date.getTime()) / 60_000));
}

function normalizeServiceType(
  serviceType: string | null | undefined,
): RescueServiceType | null {
  const normalized = serviceType?.trim();
  if (
    normalized === 'rescue'
    || normalized === 'loan'
    || normalized === 'proyect'
    || normalized === 'direct_budget'
  ) {
    return normalized;
  }
  return null;
}

export function findTimePerStage(
  settings: RescueGeneralSettings | null | undefined,
  serviceType: RescueServiceType | null,
  operativeStatus: OperationalRescueStatus,
): SlaTimePerStage | null {
  if (!settings || !serviceType) return null;

  return (
    settings.sla.time_per_stage.find(
      (row) =>
        row.service_type === serviceType
        && row.operative_status === operativeStatus,
    ) ?? null
  );
}

export function findUpdateChat(
  settings: RescueGeneralSettings | null | undefined,
  serviceType: RescueServiceType | null,
  operativeStatus: OperationalRescueStatus,
): SlaUpdateChatConfig | null {
  if (!settings || !serviceType) return null;

  return (
    settings.sla.update_chat.find(
      (row) =>
        row.service_type === serviceType
        && row.operative_status === operativeStatus,
    ) ?? null
  );
}

function resolveActiveLevelAlert(
  levelAlerts: SlaLevelAlertConfig[],
  percentConsumed: number,
): SlaLevelAlertConfig | null {
  if (levelAlerts.length === 0) return null;

  const sorted = [...levelAlerts].sort(
    (a, b) =>
      a.percentage_limit - b.percentage_limit
      || (a.id ?? 0) - (b.id ?? 0),
  );

  let active: SlaLevelAlertConfig | null = null;
  for (const level of sorted) {
    if (percentConsumed >= level.percentage_limit) {
      active = level;
    }
  }
  return active;
}

function formatChatThresholdLabel(
  time: number,
  unit: SlaUpdateChatConfig['yellow_unit'],
): string {
  return formatSlaTimePreview(time, unit);
}

function hexToSubtleBadgeStyle(hex: string): Record<string, string> {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return {};
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return {
    color: `#${normalized}`,
    backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.1)`,
    boxShadow: `inset 0 0 0 1px rgba(${red}, ${green}, ${blue}, 0.25)`,
  };
}

export function getOperationalChatBadgeState(
  card: Pick<
    RescueCard,
    'last_comment_at' | 'service_type' | 'operative_status'
  >,
  settings: RescueGeneralSettings | null | undefined,
  nowMs: number,
): OperationalChatBadgeState {
  const serviceType = normalizeServiceType(card.service_type);
  const chatConfig = findUpdateChat(
    settings,
    serviceType,
    card.operative_status,
  );

  if (!card.last_comment_at) {
    return {
      label: 'Sin chat',
      color: 'neutral',
      tooltip: chatConfig
        ? `Sin mensajes en chat. Alerta amarilla a los ${formatChatThresholdLabel(chatConfig.yellow_time, chatConfig.yellow_unit)} y roja a los ${formatChatThresholdLabel(chatConfig.red_time, chatConfig.red_unit)}.`
        : 'Sin mensajes registrados en el chat de esta solicitud.',
    };
  }

  const elapsedMinutes = elapsedMinutesSince(card.last_comment_at, nowMs);
  const label =
    elapsedMinutes != null
      ? formatElapsedDuration(elapsedMinutes)
      : formatElapsedSince(card.last_comment_at);

  if (!chatConfig) {
    return {
      label,
      color: 'neutral',
      tooltip: `Último mensaje en chat hace ${label}. No hay umbrales de alerta configurados para este estatus.`,
    };
  }

  const yellowMinutes = displayToMinutes(
    chatConfig.yellow_time,
    chatConfig.yellow_unit,
  );
  const redMinutes = displayToMinutes(
    chatConfig.red_time,
    chatConfig.red_unit,
  );
  const yellowLabel = formatChatThresholdLabel(
    chatConfig.yellow_time,
    chatConfig.yellow_unit,
  );
  const redLabel = formatChatThresholdLabel(
    chatConfig.red_time,
    chatConfig.red_unit,
  );

  let color: OperationalBadgeColor = 'success';
  let statusText = 'Sin alerta';

  if (elapsedMinutes != null && elapsedMinutes >= redMinutes) {
    color = 'error';
    statusText = 'Alerta roja — gestor sin escribir en chat';
  } else if (elapsedMinutes != null && elapsedMinutes >= yellowMinutes) {
    color = 'warning';
    statusText = 'Alerta amarilla — gestor sin escribir en chat';
  }

  return {
    label,
    color,
    tooltip: `Último mensaje en chat hace ${label}. Umbrales: amarillo ${yellowLabel}, rojo ${redLabel}. Estado: ${statusText}.`,
  };
}

export function getOperationalSlaBadgeState(
  card: Pick<
    RescueCard,
    'phase_started_at' | 'service_type' | 'operative_status'
  >,
  settings: RescueGeneralSettings | null | undefined,
  nowMs: number,
): OperationalSlaBadgeState {
  const serviceType = normalizeServiceType(card.service_type);
  const stageConfig = findTimePerStage(
    settings,
    serviceType,
    card.operative_status,
  );
  const statusLabel = getOperationalStatusLabel(card.operative_status);

  if (!stageConfig) {
    return {
      label: 'SLA —',
      color: 'neutral',
      customStyle: undefined,
      tooltip: `Tiempo límite SLA no configurado para ${statusLabel}.`,
    };
  }

  const limitMinutes = displayToMinutes(stageConfig.time, stageConfig.unit);
  if (limitMinutes <= 0) {
    return {
      label: 'SLA —',
      color: 'neutral',
      customStyle: undefined,
      tooltip: `Tiempo límite SLA inválido para ${statusLabel}.`,
    };
  }

  const elapsedMinutes =
    elapsedMinutesSince(card.phase_started_at, nowMs) ?? 0;
  const remainingMinutes = limitMinutes - elapsedMinutes;
  const percentConsumed = (elapsedMinutes / limitMinutes) * 100;
  const activeLevel = resolveActiveLevelAlert(
    settings?.sla.level_alerts ?? [],
    percentConsumed,
  );

  const label =
    remainingMinutes > 0
      ? formatElapsedDuration(remainingMinutes)
      : 'Vencido';

  const limitLabel = formatSlaTimePreview(stageConfig.time, stageConfig.unit);
  const elapsedLabel = formatElapsedDuration(elapsedMinutes);
  const remainingLabel =
    remainingMinutes > 0
      ? formatElapsedDuration(remainingMinutes)
      : 'tiempo agotado';

  let color: OperationalBadgeColor = 'success';
  let customStyle: Record<string, string> | undefined;

  if (activeLevel) {
    customStyle = hexToSubtleBadgeStyle(activeLevel.color);
    color = remainingMinutes <= 0 ? 'error' : 'warning';
  } else if (remainingMinutes <= 0) {
    color = 'error';
  }

  const levelText = activeLevel
    ? `${activeLevel.name} (${activeLevel.percentage_limit}%)`
    : 'Sin alerta';

  return {
    label,
    color,
    customStyle,
    tooltip: `Estatus: ${statusLabel}. Límite SLA: ${limitLabel}. Transcurrido: ${elapsedLabel}. Restante: ${remainingLabel}. Nivel: ${levelText}.`,
  };
}
