import * as z from 'zod';

function parseCommissionPercent(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const operativeCommissionRowSchema = z.object({
  commission: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => {
      if (s === '') return true;
      const n = parseCommissionPercent(s);
      return n != null && n >= 0 && n <= 100;
    }, 'La comisión debe estar entre 0 y 100 o déjala vacía para usar el default'),
});

export type OperativeCommissionRowOutput = z.output<
  typeof operativeCommissionRowSchema
>;
