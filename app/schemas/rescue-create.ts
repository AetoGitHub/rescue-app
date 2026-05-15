import * as z from 'zod';
import type { RescueCreateBody } from '~/interfaces/rescue';

const RESCUE_SERVICE_TYPES = [
  'rescue',
  'loan',
  'proyect',
  'direct_budget',
] as const;

function parseCoord(value: string | undefined): number | undefined {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

const optionalCoordString = (label: string, min: number, max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .superRefine((s, ctx) => {
      if (s === '') return;
      const n = parseCoord(s);
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
    });

const coordFromNullable = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (v == null ? '' : String(v)),
    optionalCoordString(label, min, max),
  );

export const rescueCreateFormSchema = z
  .object({
    service_type: z.enum(RESCUE_SERVICE_TYPES, {
      error: 'Selecciona un tipo de servicio',
    }),
    client: z.number().int().positive({ error: 'Selecciona un cliente' }),
    general_public: z.boolean(),
    location_latitude: coordFromNullable('La latitud', -90, 90),
    location_longitude: coordFromNullable('La longitud', -180, 180),
    location_description: z.string().transform((s) => s.trim()),
    internal_notes: z.string().transform((s) => s.trim()),
  })
  .superRefine((data, ctx) => {
    const lat = parseCoord(data.location_latitude);
    const lng = parseCoord(data.location_longitude);
    const hasLat = lat != null;
    const hasLng = lng != null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indica latitud y longitud, o deja ambas vacías',
        path: ['location_latitude'],
      });
    }
  });

export type RescueCreateFormOutput = z.output<typeof rescueCreateFormSchema>;

export function rescueFormToCreateBody(
  data: RescueCreateFormOutput,
): RescueCreateBody {
  return {
    service_type: data.service_type,
    client: data.client,
    general_public: data.general_public,
    supplier: null,
    location_latitude: String(data.location_latitude ?? '').trim(),
    location_longitude: String(data.location_longitude ?? '').trim(),
    location_description: data.location_description,
    internal_notes: data.internal_notes,
  };
}
