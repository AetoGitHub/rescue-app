import * as z from 'zod';

export const rescueServiceUpdateSchema = z.object({
  vehicle: z.string().transform((s) => s.trim()),
  service_description: z.string().transform((s) => s.trim()),
  internal_notes: z.string().transform((s) => s.trim()),
});

export type RescueServiceUpdateFormState = {
  vehicle: string;
  service_description: string;
  internal_notes: string;
};

export type RescueServiceUpdateFormOutput = z.infer<
  typeof rescueServiceUpdateSchema
>;

export interface RescueServiceUpdateBody {
  vehicle: string;
  service_description: string;
  internal_notes: string;
}

export function emptyRescueServiceUpdateState(): RescueServiceUpdateFormState {
  return {
    vehicle: '',
    service_description: '',
    internal_notes: '',
  };
}

export function rescueServiceUpdateToBody(
  data: RescueServiceUpdateFormOutput,
): RescueServiceUpdateBody {
  return {
    vehicle: data.vehicle,
    service_description: data.service_description,
    internal_notes: data.internal_notes,
  };
}
