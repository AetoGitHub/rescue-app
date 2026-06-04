import { z } from 'zod';
import { isRescueUnlockDatetimeLocalInPast } from '~/utils/rescue-unlock';

export function createRescueUnlockFormSchema(now = new Date()) {
  return z.object({
    unlocked_until_local: z
      .string()
      .trim()
      .min(1, 'La fecha de desbloqueo es obligatoria')
      .refine(
        (value) => !isRescueUnlockDatetimeLocalInPast(value, now),
        'La fecha no puede estar en el pasado',
      ),
    reason: z.string().trim().min(1, 'La razón es obligatoria'),
  });
}

export const rescueUnlockFormSchema = createRescueUnlockFormSchema();

export type RescueUnlockFormState = z.infer<
  ReturnType<typeof createRescueUnlockFormSchema>
>;
