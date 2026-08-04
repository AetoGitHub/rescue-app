import { z } from 'zod';
import type { FillOcSubmitBody } from '~/interfaces/nexxt-step/fill-oc';

export const fillOcFormSchema = z.object({
  oc: z.string().trim().min(1, 'Ingresa el número de orden de compra'),
});

export type FillOcFormState = z.infer<typeof fillOcFormSchema>;

export function fillOcFormToSubmitBody(
  id: number,
  data: FillOcFormState,
): FillOcSubmitBody {
  return {
    id,
    oc: data.oc.trim(),
  };
}
