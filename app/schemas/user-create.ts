import * as z from 'zod';

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
  password: passwordUpdateField,
  is_active: z.boolean(),
});

export type UserFormOutputCreate = z.output<typeof userCreateSchema>;
export type UserFormOutputUpdate = z.output<typeof userUpdateSchema>;
