import { OPERATIONAL_KANBAN_COLUMNS } from '~/constants/operational-kanban';
import type { SlaDurationUnit, SlaTimePerStage } from '~/interfaces/sla';
import type { RescueServiceType } from '~/interfaces/rescue';
import { getOperationalStatusLabel } from '~/utils/operational-rescue-detail';

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

export function displayToMinutes(
  value: number,
  unit: SlaDurationUnit,
): number {
  const safe = Math.max(0, Math.floor(Number(value) || 0));
  if (unit === 'hours') return safe * MINUTES_PER_HOUR;
  if (unit === 'days') return safe * MINUTES_PER_DAY;
  return safe;
}

export function minutesToDisplay(
  minutes: number,
  unit: SlaDurationUnit,
): number {
  const safe = Math.max(0, Math.floor(Number(minutes) || 0));
  if (unit === 'hours') return Math.floor(safe / MINUTES_PER_HOUR);
  if (unit === 'days') return Math.floor(safe / MINUTES_PER_DAY);
  return safe;
}

export function formatSlaTimePreview(
  time: number,
  unit: SlaDurationUnit,
): string {
  const safe = Math.max(0, Math.floor(Number(time) || 0));
  if (safe === 0) return '0 min';

  if (unit === 'days') {
    return safe === 1 ? '1 día' : `${safe} días`;
  }
  if (unit === 'hours') {
    return safe === 1 ? '1 hr' : `${safe} hrs`;
  }
  return safe === 1 ? '1 min' : `${safe} min`;
}

export function formatSlaDurationPreview(minutes: number): string {
  const safe = Math.max(0, Math.floor(Number(minutes) || 0));
  if (safe === 0) return '0 min';

  const days = Math.floor(safe / MINUTES_PER_DAY);
  const hours = Math.floor((safe % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  const mins = safe % MINUTES_PER_HOUR;

  const parts: string[] = [];
  if (days > 0) parts.push(days === 1 ? '1 día' : `${days} días`);
  if (hours > 0) parts.push(hours === 1 ? '1 hr' : `${hours} hrs`);
  if (mins > 0 && days === 0) {
    parts.push(mins === 1 ? '1 min' : `${mins} min`);
  }

  return parts.join(' ') || '0 min';
}

export interface SlaStatusTimelineItem {
  label: string;
  durationLabel: string;
  isOptional: boolean;
}

export function buildSlaStatusTimeline(
  rows: Pick<SlaTimePerStage, 'service_type' | 'operative_status' | 'time' | 'unit'>[],
  serviceType: RescueServiceType,
): SlaStatusTimelineItem[] {
  const filtered = rows.filter((row) => row.service_type === serviceType);
  if (filtered.length === 0) return [];

  const order = new Map(
    OPERATIONAL_KANBAN_COLUMNS.map((column, index) => [column.status, index]),
  );

  const sorted = [...filtered].sort((a, b) => {
    const aIndex = order.get(a.operative_status) ?? 999;
    const bIndex = order.get(b.operative_status) ?? 999;
    return aIndex - bIndex;
  });

  return sorted.map((row) => ({
    label: getOperationalStatusLabel(row.operative_status),
    durationLabel: formatSlaTimePreview(row.time, row.unit),
    isOptional: row.operative_status === 'waiting_advance_payment',
  }));
}

export function getSlaAlertThresholdHelper(percentageLimit: number): {
  text: string;
  colorClass: string;
} {
  if (percentageLimit < 100) {
    return {
      text: '⏰ Alerta preventiva',
      colorClass: 'text-success',
    };
  }
  if (percentageLimit === 100) {
    return {
      text: '⚠️ Alerta de vencimiento',
      colorClass: 'text-warning',
    };
  }
  return {
    text: '🔴 Alerta de incumplimiento',
    colorClass: 'text-error',
  };
}
