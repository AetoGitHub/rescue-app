import * as z from 'zod';
import type { ClientContactCreateBody } from '~/interfaces/catalogs/client';

export const rescueAuthorizerAssignSchema = z.object({
  authorizer: z
    .number({ message: 'Selecciona un autorizador' })
    .int()
    .positive('Selecciona un autorizador'),
});

export type RescueAuthorizerAssignFormState = {
  authorizer?: number;
};

export type RescueAuthorizerAssignFormOutput = z.infer<
  typeof rescueAuthorizerAssignSchema
>;

export interface RescueAuthorizerAssignBody {
  authorizer: number | null;
}

export function rescueAuthorizerAssignToBody(
  data: RescueAuthorizerAssignFormOutput,
): RescueAuthorizerAssignBody {
  return { authorizer: data.authorizer ?? null };
}

/** Alta mínima de contacto autorizador desde el detalle de rescate (name/position/email/phone). */
export const rescueAuthorizerContactCreateSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'El nombre es obligatorio')),
  position: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'El puesto es obligatorio')),
  email: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.union([z.literal(''), z.email({ error: 'Introduce un correo válido' })])),
  phone: z
    .string()
    .transform((s) => normalizeMexicoPhone(s))
    .pipe(z.string().min(1, 'El teléfono es obligatorio')),
});

export type RescueAuthorizerContactCreateFormState = {
  name: string;
  position: string;
  email: string;
  phone: string;
};

export function rescueAuthorizerContactCreateToBody(
  clientId: number,
  input: z.infer<typeof rescueAuthorizerContactCreateSchema>,
): ClientContactCreateBody {
  return {
    client: clientId,
    name: input.name,
    position: input.position,
    email: input.email,
    phone: input.phone,
    whatsapp: '',
    is_authorizer: true,
    receives_quotes: false,
    receives_oc_reminders: false,
    receives_account_status: false,
    is_billing_contact: false,
    is_responsible: false,
  };
}
