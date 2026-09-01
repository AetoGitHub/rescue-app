import * as z from 'zod';
import {
  TMS_PURCHASE_ORDER_MAX_FILE_BYTES,
  TMS_PURCHASE_ORDER_MAX_FILES,
} from '~/constants/tms-portal-api';
import type { TmsRescueUpdateBody } from '~/interfaces/portals/tms';
import { isPurchaseOrderPdfFile } from '~/utils/purchase-order-job';

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
          return isPurchaseOrderPdfFile(value);
        },
        'Selecciona únicamente archivos PDF',
      ),
    )
    .min(1, 'Selecciona al menos un archivo PDF')
    .max(
      TMS_PURCHASE_ORDER_MAX_FILES,
      `Puedes subir hasta ${TMS_PURCHASE_ORDER_MAX_FILES} archivos PDF`,
    )
    .superRefine((files, ctx) => {
      if (files.some((file) => file.size > TMS_PURCHASE_ORDER_MAX_FILE_BYTES)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Cada PDF debe pesar 10 MB o menos',
        });
      }
      if (files.some((file) => file.size === 0)) {
        ctx.addIssue({
          code: 'custom',
          message: 'El archivo está vacío',
        });
      }
    }),
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
