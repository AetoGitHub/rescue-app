import { z } from 'zod';
import type { CreditUnlockCreateBody, CreditUnlockMode } from '~/interfaces/catalogs/credit';

export const CREDIT_UNLOCK_MODE_OPTIONS = [
  { label: 'Monto', value: 'money' as const },
  { label: 'Días', value: 'days' as const },
];

export const creditUnlockFormSchema = z
  .object({
    mode: z.enum(['money', 'days']),
    value: z.string().trim().min(1, 'Ingresa un valor'),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'money') {
      const amount = Number(data.value);
      if (!Number.isFinite(amount) || amount <= 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ingresa un monto mayor a cero',
          path: ['value'],
        });
      }
      return;
    }

    const days = Number(data.value);
    if (!Number.isInteger(days) || days <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ingresa un número entero de días mayor a cero',
        path: ['value'],
      });
    }
  });

export type CreditUnlockFormState = z.infer<typeof creditUnlockFormSchema>;

export function creditUnlockFormToCreateBody(
  creditId: number,
  data: CreditUnlockFormState,
): CreditUnlockCreateBody {
  const mode = data.mode as CreditUnlockMode;
  const value =
    mode === 'money'
      ? Number(data.value).toFixed(2)
      : String(Math.trunc(Number(data.value)));

  return {
    credit: creditId,
    mode,
    value,
  };
}
