import { CalendarDateTime, type DateValue } from '@internationalized/date';
import type { RescueUnlockBody } from '~/interfaces/rescue/administrative';
import type { RescueUnlockFormState } from '~/utils/rescue-unlock-form';

const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

function pad(part: number): string {
  return String(part).padStart(2, '0');
}

/** Form string -> `UInputDate` value (minute granularity, so hours stay editable). */
export function toUnlockCalendarDateTime(
  value: string,
): CalendarDateTime | undefined {
  const match = DATETIME_LOCAL_PATTERN.exec(value.trim());
  if (!match) return undefined;

  const [, year, month, day, hour, minute] = match;
  return new CalendarDateTime(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
  );
}

/** `UInputDate` value -> form string; missing time segments fall back to 00:00. */
export function fromUnlockCalendarDateTime(
  value: DateValue | null | undefined,
): string {
  if (value == null) return '';

  const hour = 'hour' in value ? value.hour : 0;
  const minute = 'minute' in value ? value.minute : 0;
  return `${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(hour)}:${pad(minute)}`;
}

export function getRescueUnlockMinCalendarDateTime(
  now = new Date(),
): CalendarDateTime {
  return new CalendarDateTime(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
  );
}

export function isRescueUnlockDatetimeLocalInPast(
  value: string,
  now = new Date(),
): boolean {
  const selected = new Date(value);
  if (Number.isNaN(selected.getTime())) return true;
  return selected.getTime() < now.getTime();
}

export function toRescueUnlockApiBody(
  form: RescueUnlockFormState,
  now = new Date(),
): RescueUnlockBody {
  const date = new Date(form.unlocked_until_local);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha de desbloqueo inválida');
  }
  if (isRescueUnlockDatetimeLocalInPast(form.unlocked_until_local, now)) {
    throw new Error('La fecha no puede estar en el pasado');
  }

  return {
    unlocked_until: date.toISOString(),
    reason: form.reason.trim(),
  };
}

/** First non-empty unlock deadline from administrative detail, list preview, or post-unlock. */
export function coalesceUnlockUntil(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function isRescueUnlockActive(
  unlockedUntil: string | null | undefined,
  now = Date.now(),
): boolean {
  return getRescueUnlockRemainingMs(unlockedUntil, now) > 0;
}

export function getRescueUnlockRemainingMs(
  unlockedUntil: string | null | undefined,
  now = Date.now(),
): number {
  if (!unlockedUntil?.trim()) return 0;
  const end = new Date(unlockedUntil).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, end - now);
}

export function formatRescueUnlockRemaining(
  unlockedUntil: string | null | undefined,
  now = Date.now(),
): string {
  const remainingMs = getRescueUnlockRemainingMs(unlockedUntil, now);
  if (remainingMs <= 0) return '0s';

  const totalSeconds = Math.ceil(remainingMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (totalMinutes < 60) {
    return seconds > 0 ? `${totalMinutes}m ${seconds}s` : `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
