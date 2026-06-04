import { z } from 'zod';

export const rescueRemittanceSchema = z.object({
  remittance_number: z.string().trim().min(1, 'Ingresa el número de remisión'),
});

export const rescueInvoiceSchema = z.object({
  invoice_number: z.string().trim().min(1, 'Ingresa el número de factura'),
  invoice_date: z.string().trim().min(1, 'Ingresa la fecha de factura'),
  invoice_amount: z
    .string()
    .trim()
    .min(1, 'Ingresa el monto')
    .refine((value) => Number(value.replace(/,/g, '')) > 0, {
      message: 'El monto debe ser mayor a 0',
    }),
});

export const rescueAdministrativePaymentSchema = z.object({
  payment_evidence_url: z
    .string()
    .trim()
    .min(1, 'Sube el comprobante de pago'),
});

export const rescueAdminRevertCancelSchema = z.object({
  reacceptance_reason_id: z
    .number({ message: 'Selecciona un motivo' })
    .int()
    .positive('Selecciona un motivo'),
});

export const rescueAdminCancelSchema = z.object({
  cancellation_reason_id: z
    .number({ message: 'Selecciona un motivo' })
    .int()
    .positive('Selecciona un motivo'),
});

export const rescuePurchaseOrderSchema = z.object({
  purchase_order_number: z
    .string()
    .trim()
    .min(1, 'Ingresa el número de orden de compra'),
});
