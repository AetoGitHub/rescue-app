import { z } from 'zod';

const operationalStatusSchema = z.string().min(1);

export const slaStageRowSchema = z
  .object({
    stage_name: z.string().trim().min(1, { message: 'Indica el nombre de la etapa' }),
    from_status: operationalStatusSchema,
    to_status: operationalStatusSchema,
    limit_minutes: z.number().int().positive({ message: 'El tiempo debe ser mayor a 0' }),
    is_active: z.boolean(),
  })
  .refine((data) => data.from_status !== data.to_status, {
    message: 'La etapa origen y destino deben ser distintas',
    path: ['to_status'],
  });

export const slaAlertLevelRowSchema = z
  .object({
    name: z.string().trim().min(1, { message: 'Indica el nombre del nivel' }),
    threshold_percent: z
      .number()
      .min(0, { message: 'El porcentaje no puede ser negativo' }),
    color: z.string().min(1, { message: 'Indica un color' }),
    is_active: z.boolean(),
    notify_assigned_manager: z.boolean(),
    notify_admin: z.boolean(),
    notify_direction: z.boolean(),
  })
  .refine(
    (data) =>
      !data.is_active ||
      data.notify_assigned_manager ||
      data.notify_admin ||
      data.notify_direction,
    {
      message: 'Selecciona al menos un destinatario de notificación',
      path: ['notify_assigned_manager'],
    },
  );

export const slaChatIdleAlertRowSchema = z
  .object({
    operative_status: operationalStatusSchema,
    yellow_limit_minutes: z
      .number()
      .int()
      .positive({ message: 'El umbral amarillo debe ser mayor a 0' }),
    red_limit_minutes: z
      .number()
      .int()
      .positive({ message: 'El umbral rojo debe ser mayor a 0' }),
    is_active: z.boolean(),
  })
  .refine((data) => data.red_limit_minutes >= data.yellow_limit_minutes, {
    message: 'El umbral rojo debe ser mayor o igual al amarillo',
    path: ['red_limit_minutes'],
  });
