import { z } from 'zod';
import type { PaymentDebtCreateBody } from '~/interfaces/payment/debt';
import type { PaymentDebtSource } from '~/constants/payment-api';

const paymentDebtSourceValues = [
  'cancelled',
  'warranty',
  'in_moment',
] as const satisfies readonly PaymentDebtSource[];

export const paymentDebtCreateSchema = z.object({
  source: z.enum(paymentDebtSourceValues, {
    error: 'Selecciona un origen de deuda',
  }),
  amount: z
    .number({ error: 'Ingresa el monto de la deuda' })
    .positive('El monto debe ser mayor a cero'),
  comment: z.string().trim().optional(),
});

export type PaymentDebtCreateFormState = z.infer<typeof paymentDebtCreateSchema>;

export function paymentDebtCreateToBody(
  userId: number,
  data: PaymentDebtCreateFormState,
): PaymentDebtCreateBody {
  const comment = data.comment?.trim();

  return {
    user: userId,
    source: data.source,
    amount: data.amount,
    ...(comment ? { comment } : {}),
  };
}
