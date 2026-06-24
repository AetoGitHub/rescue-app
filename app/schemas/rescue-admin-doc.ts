import * as z from 'zod';

const optionalFolioField = z
  .string()
  .transform((s) => s.trim())
  .transform((s) => (s.length > 0 ? s : null));

const adminDocFoliosBase = z.object({
  remittance_folio: optionalFolioField,
  invoice_folio: optionalFolioField,
});

function withAtLeastOneFolio<T extends z.ZodType>(
  schema: T,
): z.ZodEffects<T, z.output<T>, z.input<T>> {
  return schema.superRefine((data, ctx) => {
    const folios = data as {
      remittance_folio: string | null;
      invoice_folio: string | null;
    };
    if (folios.remittance_folio == null && folios.invoice_folio == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indica remisión o factura',
        path: ['remittance_folio'],
      });
    }
  });
}

export const rescueAdminDocSchema = withAtLeastOneFolio(adminDocFoliosBase);

export const rescueAdminDocCopySchema = withAtLeastOneFolio(
  adminDocFoliosBase.extend({
    extra_rescues: z.array(z.number().int().positive()),
  }),
);

export type RescueAdminDocFormState = {
  remittance_folio: string;
  invoice_folio: string;
  extra_rescues: number[];
};

export type RescueAdminDocFormOutput = z.infer<typeof rescueAdminDocCopySchema>;

export interface RescueAdminDocBody {
  remittance_folio: string | null;
  invoice_folio: string | null;
  extra_rescues: number[];
}

export function parseRescueAdminDocInput(input: {
  remittance_folio: string;
  invoice_folio: string;
}) {
  return rescueAdminDocSchema.safeParse(input);
}

export function rescueAdminDocToBody(
  data: RescueAdminDocFormOutput,
): RescueAdminDocBody {
  return {
    remittance_folio: data.remittance_folio,
    invoice_folio: data.invoice_folio,
    extra_rescues: data.extra_rescues,
  };
}

export function formatRescueDropdownLabel(row: {
  folio: string;
  client_name: string;
}): string {
  const folio = row.folio.trim();
  const client = row.client_name.trim();
  if (folio && client) return `${folio} · ${client}`;
  return folio || client || '—';
}
