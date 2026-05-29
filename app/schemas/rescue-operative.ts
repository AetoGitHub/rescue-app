import * as z from 'zod';

const positiveAmountString = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => {
    const n = Number(s.replace(/,/g, ''));
    return Number.isFinite(n) && n > 0;
  }, 'El monto del anticipo debe ser mayor a $0');

export const rescueAdvanceAmountSchema = z.object({
  advance_amount: positiveAmountString,
});

export const rescueAdvanceConfirmSchema = z.object({
  advance_amount: positiveAmountString,
  advance_date: z.string().min(1, 'La fecha de recepción es obligatoria'),
  advance_payment_method: z
    .string()
    .min(1, 'Selecciona la forma de pago'),
  advance_reference: z
    .string()
    .trim()
    .min(1, 'La referencia o comprobante es obligatoria'),
});

export const rescueCancelServiceSchema = z.object({
  cancel_reason: z
    .string()
    .trim()
    .min(3, 'Indica el motivo de cancelación'),
});

const ratingRowSchema = z.object({
  supplier_id: z.number().int().positive(),
  supplier_name: z.string(),
  score: z.number().min(1, 'Califica al proveedor').max(5),
  comment: z.string(),
});

export const rescueServiceCompletedSchema = z
  .object({
    close_date: z.string().min(1, 'La fecha de cierre es obligatoria'),
    disbursement_date: z.string(),
    disbursement_payment_method: z.string(),
    ratings: z.array(ratingRowSchema),
    is_loan: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const unrated = data.ratings.filter((r) => r.score < 1);
    if (data.ratings.length > 0 && unrated.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Califica a todos los proveedores asignados',
        path: ['ratings'],
      });
    }
    if (data.is_loan) {
      if (!data.disbursement_date.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'La fecha de desembolso es obligatoria',
          path: ['disbursement_date'],
        });
      }
      if (!data.disbursement_payment_method.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Selecciona la forma de pago del desembolso',
          path: ['disbursement_payment_method'],
        });
      }
    }
  });
