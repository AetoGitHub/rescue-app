import { z } from 'zod';
import type { PaymentDebtCreateBody } from '~/interfaces/payment/debt';

export const paymentDebtCreateSchema = z.object({
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
    source: 'in_moment',
    amount: data.amount,
    ...(comment ? { comment } : {}),
  };
}
