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

export function isRescueUnlockActive(
  unlockedUntil: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!unlockedUntil?.trim()) return false;
  const date = new Date(unlockedUntil);
  return !Number.isNaN(date.getTime()) && date.getTime() > now;
}
