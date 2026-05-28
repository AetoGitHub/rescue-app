import { z } from 'zod';
import { displayToMinutes } from '~/utils/sla-duration';

const operationalStatusSchema = z.string().min(1);
const durationUnitSchema = z.enum(['minutes', 'hours', 'days']);

export const slaTimePerStageRowSchema = z.object({
  operative_status: operationalStatusSchema,
  time: z.number().int().min(1, { message: 'El tiempo debe ser al menos 1' }),
  unit: durationUnitSchema,
});

export const slaLevelAlertRowSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Indica el nombre del nivel' })
      .max(50),
    percentage_limit: z
      .number()
      .int()
      .min(1, { message: 'El porcentaje debe ser al menos 1' }),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Indica un color hex válido' }),
    notify_gestor: z.boolean(),
    notify_admin: z.boolean(),
    notify_direccion: z.boolean(),
  })
  .refine(
    (data) => data.notify_gestor || data.notify_admin || data.notify_direccion,
    {
      message: 'Selecciona al menos un destinatario de notificación',
      path: ['notify_gestor'],
    },
  );

export const slaUpdateChatRowSchema = z
  .object({
    operative_status: operationalStatusSchema,
    yellow_time: z
      .number()
      .int()
      .min(1, { message: 'El umbral amarillo debe ser al menos 1' }),
    yellow_unit: durationUnitSchema,
    red_time: z
      .number()
      .int()
      .min(1, { message: 'El umbral rojo debe ser al menos 1' }),
    red_unit: durationUnitSchema,
  })
  .refine(
    (data) =>
      displayToMinutes(data.red_time, data.red_unit) >=
      displayToMinutes(data.yellow_time, data.yellow_unit),
    {
      message: 'El umbral rojo debe ser mayor o igual al amarillo',
      path: ['red_time'],
    },
  );
