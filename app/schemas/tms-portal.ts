import * as z from 'zod';
import type { TmsRescueUpdateBody } from '~/interfaces/portals/tms';

const optionalPdfUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || URL.canParse(value),
    'La URL de la orden de compra no es válida',
  )
  .transform((value) => value || null);

export const tmsRescueDraftSchema = z.object({
  internal_notes: z.string(),
  oc_pdf: optionalPdfUrlSchema,
});

export const tmsPurchaseOrderUploadSchema = z.object({
  files: z
    .array(
      z.custom<File>(
        (value) => {
          if (typeof File === 'undefined' || !(value instanceof File)) return false;
          return (
            value.type === 'application/pdf'
            || value.name.toLowerCase().endsWith('.pdf')
          );
        },
        'Selecciona únicamente archivos PDF',
      ),
    )
    .min(1, 'Selecciona al menos un archivo PDF')
    .max(20, 'Puedes subir hasta 20 archivos PDF por lote'),
});

export type TmsRescueDraftState = {
  internal_notes: string;
  oc_pdf: string;
};

export type TmsRescueDraftOutput = z.infer<typeof tmsRescueDraftSchema>;

export type TmsPurchaseOrderUploadState = {
  files: File[];
};

export function tmsRescueDraftToUpdateBody(
  rescueId: number,
  data: TmsRescueDraftOutput,
): TmsRescueUpdateBody {
  return {
    id: rescueId,
    oc_pdf: data.oc_pdf,
    internal_notes: data.internal_notes,
  };
}
