import * as z from 'zod';
import { parseRescueCoord } from '~/schemas/rescue-create';

const requiredCoord = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (v == null ? '' : String(v)),
    z
      .string()
      .transform((s) => s.trim())
      .superRefine((s, ctx) => {
        if (s === '') {
          ctx.addIssue({
            code: 'custom',
            message: `${label} es obligatoria`,
          });
          return;
        }
        const n = parseRescueCoord(s);
        if (n == null) {
          ctx.addIssue({
            code: 'custom',
            message: `${label} no es un número válido`,
          });
          return;
        }
        if (n < min || n > max) {
          ctx.addIssue({
            code: 'custom',
            message: `${label} debe estar entre ${min} y ${max}`,
          });
        }
      }),
  );

export const rescueLocationUpdateSchema = z.object({
  location_latitude: requiredCoord('La latitud', -90, 90),
  location_longitude: requiredCoord('La longitud', -180, 180),
  location_description: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'Indica la descripción del lugar')),
});

export type RescueLocationUpdateFormState = {
  location_latitude: string | null;
  location_longitude: string | null;
  location_description: string;
};

export type RescueLocationUpdateFormOutput = z.infer<
  typeof rescueLocationUpdateSchema
>;

export interface RescueLocationUpdateBody {
  location_latitude: string;
  location_longitude: string;
  location_description: string;
}

export function emptyRescueLocationUpdateState(): RescueLocationUpdateFormState {
  return {
    location_latitude: null,
    location_longitude: null,
    location_description: '',
  };
}

export function rescueLocationUpdateToBody(
  data: RescueLocationUpdateFormOutput,
): RescueLocationUpdateBody {
  return {
    location_latitude: String(data.location_latitude ?? '').trim(),
    location_longitude: String(data.location_longitude ?? '').trim(),
    location_description: data.location_description,
  };
}
