import type { RescueUnlockBody } from '~/interfaces/rescue/administrative';
import type { RescueUnlockFormState } from '~/utils/rescue-unlock-form';

/** Value for `<input type="datetime-local">` (local time, `YYYY-MM-DDTHH:mm`). */
export function toDatetimeLocalInputValue(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Earliest selectable unlock datetime (now, local). */
export function getRescueUnlockMinDatetimeLocal(now = new Date()): string {
  return toDatetimeLocalInputValue(now);
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
