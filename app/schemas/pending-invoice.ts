import { z } from 'zod';
import type { RescueAdminDocBody } from '~/schemas/rescue-admin-doc';

export const pendingInvoiceFacturaSchema = z.object({
  invoice_folio: z.string().trim().min(1, 'Ingresa el número de factura'),
});

export type PendingInvoiceFacturaFormState = z.input<
  typeof pendingInvoiceFacturaSchema
>;
export type PendingInvoiceFacturaFormOutput = z.infer<
  typeof pendingInvoiceFacturaSchema
>;

const optionalInvoiceFolioField = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length > 0 ? value : null));

const optionalOcPdfUrlField = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || URL.canParse(value),
    'La URL del PDF de orden de compra no es válida',
  )
  .transform((value) => (value.length > 0 ? value : null));

export const pendingInvoiceAdminDocSchema = z
  .object({
    invoice_folio: optionalInvoiceFolioField,
    oc_pdf: optionalOcPdfUrlField,
  })
  .superRefine((data, ctx) => {
    if (data.invoice_folio == null && data.oc_pdf == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Sube el PDF de OC o indica el número de factura',
        path: ['invoice_folio'],
      });
    }
  });

export type PendingInvoiceAdminDocOutput = z.infer<
  typeof pendingInvoiceAdminDocSchema
>;

/** 1×1 Por Facturar body: same admin_doc fields, never remisión. */
export function pendingInvoiceAdminDocToBody(
  data: PendingInvoiceAdminDocOutput,
): RescueAdminDocBody {
  return {
    remittance_folio: null,
    invoice_folio: data.invoice_folio,
    extra_rescues: [],
    oc_pdf: data.oc_pdf,
  };
}

export function parsePendingInvoiceAdminDoc(input: {
  invoice_folio?: string | null;
  oc_pdf?: string | null;
}) {
  return pendingInvoiceAdminDocSchema.safeParse({
    invoice_folio: input.invoice_folio ?? '',
    oc_pdf: input.oc_pdf ?? '',
  });
}
