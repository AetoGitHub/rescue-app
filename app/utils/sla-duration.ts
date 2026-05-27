import type { SlaDurationUnit } from '~/interfaces/sla';
import type { SlaStageConfig } from '~/interfaces/sla';
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

export function inferBestDurationUnit(minutes: number): SlaDurationUnit {
  const safe = Math.max(0, Math.floor(Number(minutes) || 0));
  if (safe > 0 && safe % MINUTES_PER_DAY === 0) return 'days';
  if (safe > 0 && safe % MINUTES_PER_HOUR === 0) return 'hours';
  return 'minutes';
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

export function formatSlaFlowDuration(minutes: number): string {
  const preview = formatSlaDurationPreview(minutes);
  return preview.replace(/\s+/g, ' ').trim();
}

export function isOptionalSlaStage(
  fromStatus: string,
  toStatus?: string,
): boolean {
  if (fromStatus === 'waiting_advance_payment') return true;
  if (toStatus === 'waiting_advance_payment') return true;
  return false;
}

export interface SlaFlowDiagramStep {
  fromLabel: string;
  toLabel: string;
  durationLabel: string;
  isOptional: boolean;
}

export function buildSlaFlowSteps(
  stages: Pick<
    SlaStageConfig,
    'from_status' | 'to_status' | 'limit_minutes' | 'is_active'
  >[],
): SlaFlowDiagramStep[] {
  const active = stages.filter((s) => s.is_active);
  if (active.length === 0) return [];

  const steps: SlaFlowDiagramStep[] = [];
  const used = new Set<string>();

  let current = active.find((s) => !active.some((o) => o.to_status === s.from_status));
  if (!current) current = active[0];

  const maxIterations = active.length + 2;
  let iterations = 0;

  while (current && iterations < maxIterations) {
    const key = `${current.from_status}->${current.to_status}`;
    if (used.has(key)) break;
    used.add(key);

    steps.push({
      fromLabel: getOperationalStatusLabel(current.from_status),
      toLabel: getOperationalStatusLabel(current.to_status),
      durationLabel: formatSlaFlowDuration(current.limit_minutes),
      isOptional: isOptionalSlaStage(current.from_status, current.to_status),
    });

    const next = active.find((s) => s.from_status === current!.to_status);
    current = next;
    iterations += 1;
  }

  return steps;
}

export function getSlaAlertThresholdHelper(percent: number): {
  text: string;
  colorClass: string;
} {
  if (percent < 100) {
    return {
      text: '⏰ Alerta preventiva',
      colorClass: 'text-success',
    };
  }
  if (percent === 100) {
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
