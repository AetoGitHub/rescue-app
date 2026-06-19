import * as z from 'zod';
import type { UserCreateBody, UserUpdateBody } from '~/interfaces/auth/user';

function parseCommissionPercent(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

const commissionField = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z.string().refine((s) => {
      const n = parseCommissionPercent(s);
      return n != null && n >= 0 && n <= 100;
    }, { error: 'La comisión debe estar entre 0 y 100' }),
  );

const userRoleEnum = z.enum(['admin', 'operator', 'seller', 'client'], {
  error: 'Selecciona un rol',
});

const usernameField = z
  .string()
  .transform((s) => s.trim().replace(/\s/g, '').toUpperCase())
  .pipe(
    z
      .string()
      .min(1, 'El usuario es obligatorio')
      .regex(/^[A-Z0-9._@+-]+$/, {
        error: 'Solo mayúsculas, números y . _ @ + - (sin espacios)',
      }),
  );

const phoneField = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string());

const passwordCreateField = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'));

const passwordUpdateField = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s === '' || s.length >= 8, {
    error: 'La contraseña debe tener al menos 8 caracteres o déjala vacía',
  });

export const userCreateSchema = z.object({
  username: usernameField,
  first_name: z.string().transform((s) => s.trim()),
  last_name: z.string().transform((s) => s.trim()),
  email: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.email({ error: 'Introduce un correo válido' })),
  role: userRoleEnum,
  phone: phoneField,
  commission: commissionField,
  password: passwordCreateField,
  is_active: z.boolean(),
});

export const userUpdateSchema = z.object({
  username: usernameField,
  first_name: z.string().transform((s) => s.trim()),
  last_name: z.string().transform((s) => s.trim()),
  email: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.email({ error: 'Introduce un correo válido' })),
  role: userRoleEnum,
  phone: phoneField,
  commission: commissionField,
  password: passwordUpdateField,
  is_active: z.boolean(),
});

export type UserFormOutputCreate = z.output<typeof userCreateSchema>;
export type UserFormOutputUpdate = z.output<typeof userUpdateSchema>;

export function userCreateToCreateBody(
  input: UserFormOutputCreate,
): UserCreateBody {
  return {
    username: input.username,
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    role: input.role,
    phone: input.phone,
    commission: input.commission,
    password: input.password,
  };
}

export function userUpdateToUpdateBody(
  input: UserFormOutputUpdate,
): UserUpdateBody {
  const body: UserUpdateBody = {
    username: input.username,
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    role: input.role,
    phone: input.phone,
    commission: input.commission,
    is_active: input.is_active,
  };
  if (input.password.trim() !== '') {
    body.password = input.password.trim();
  }
  return body;
}
