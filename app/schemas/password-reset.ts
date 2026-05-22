import * as z from 'zod';

const passwordField = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'));

export const passwordResetRequestSchema = z.object({
  identifier: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'Indica tu correo o nombre de usuario')),
});

export const passwordResetConfirmSchema = z
  .object({
    code: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'El código es obligatorio')),
    password: passwordField,
    password2: passwordField,
  })
  .refine((data) => data.password === data.password2, {
    message: 'Las contraseñas no coinciden',
    path: ['password2'],
  });

export type PasswordResetRequestInput = z.input<typeof passwordResetRequestSchema>;
export type PasswordResetRequestOutput = z.output<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.input<typeof passwordResetConfirmSchema>;
export type PasswordResetConfirmOutput = z.output<typeof passwordResetConfirmSchema>;
