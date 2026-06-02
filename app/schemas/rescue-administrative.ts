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
  payment_amount: z
    .string()
    .trim()
    .min(1, 'Ingresa el monto del pago')
    .refine((value) => Number(value.replace(/,/g, '')) > 0, {
      message: 'El monto debe ser mayor a 0',
    }),
  payment_date: z.string().trim().min(1, 'Ingresa la fecha de pago'),
  payment_method: z.string().trim().min(1, 'Selecciona la forma de pago'),
  payment_reference: z.string().optional(),
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
