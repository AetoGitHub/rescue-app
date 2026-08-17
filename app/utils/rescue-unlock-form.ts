import { z } from 'zod';
import {
  isRescueUnlockDatetimeLocalInPast,
  RESCUE_UNLOCK_PAST_DATE_MESSAGE,
} from '~/utils/rescue-unlock';

function resolveUnlockNow(now: Date | (() => Date)): Date {
  return typeof now === 'function' ? now() : now;
}

export function createRescueUnlockFormSchema(
  now: Date | (() => Date) = () => new Date(),
) {
  return z.object({
    unlocked_until_local: z
      .string()
      .trim()
      .min(1, 'La fecha de desbloqueo es obligatoria')
      .refine(
        (value) => !isRescueUnlockDatetimeLocalInPast(value, resolveUnlockNow(now)),
        RESCUE_UNLOCK_PAST_DATE_MESSAGE,
      ),
    reason: z.string().trim().min(1, 'La razón es obligatoria'),
  });
}

export const rescueUnlockFormSchema = createRescueUnlockFormSchema();

export type RescueUnlockFormState = z.infer<
  ReturnType<typeof createRescueUnlockFormSchema>
>;
