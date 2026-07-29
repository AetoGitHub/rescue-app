import { z } from 'zod';

export const approveLinkGenerateSchema = z.object({
  ids: z
    .array(z.number())
    .min(1, 'Selecciona al menos un autorizador'),
});

export type ApproveLinkGenerateFormState = z.infer<
  typeof approveLinkGenerateSchema
>;

export function emptyApproveLinkGenerateState(): ApproveLinkGenerateFormState {
  return { ids: [] };
}
