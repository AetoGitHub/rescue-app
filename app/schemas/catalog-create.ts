import * as z from 'zod';
import {
  BILLING_TYPE_VALUES,
  SERVICE_UNIT_VALUES,
} from '~/constants/catalog-select-options';
import type {
  ContractCreateBody,
  ContractItemCreateBody,
  ContractItemUpdateBody,
  ContractUpdateBody,
} from '~/interfaces/catalogs/contract';
import type { CreditCreateBody } from '~/interfaces/catalogs/credit';
import type {
  ClientContactCreateBody,
  ClientContactUpdateBody,
} from '~/interfaces/catalogs/client';

const requiredStr = (label: string) =>
  z.string().transform((s) => s.trim()).pipe(z.string().min(1, `${label} es obligatorio`));

const catalogNameField = (label: string) =>
  requiredStr(label).transform((value) => normalizeCatalogName(value));

const catalogRfcField = (label: string) =>
  requiredStr(label).transform((value) => normalizeCatalogName(value));

export const companyCreateSchema = z.object({
  name: catalogNameField('El nombre'),
  business_name: requiredStr('La razón social'),
  rfc: catalogRfcField('El RFC'),
  phone: requiredStr('El teléfono'),
  email: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.email({ error: 'Introduce un correo válido' })),
  address: requiredStr('La dirección'),
  client_type: z.enum(['CASH', 'CREDIT', 'PUBLIC'], {
    error: 'Selecciona un tipo de cliente',
  }),
  billing_type: z.enum(BILLING_TYPE_VALUES, {
    error: 'Selecciona un tipo de facturación',
  }),
  commission_type: z.enum(['PERCENTAGE', 'FIXED'], {
    error: 'Selecciona un tipo de comisión',
  }),
  commission_value: requiredStr('El valor de comisión'),
  commission_fixed: requiredStr('La comisión fija'),
  price_multiplier: requiredStr('El multiplicador de precio'),
});

export const clientCreateSchema = companyCreateSchema.extend({
  company: z.number().int().positive().optional(),
  seller: z.number().int().positive({ error: 'Selecciona un vendedor' }),
  notes: z.string(),
  is_active: z.boolean().optional(),
});

const creditLimitField = requiredStr('El límite de crédito').refine(
  (value) => {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100_000_000;
  },
  { error: 'El límite debe estar entre 0.00 y 100,000,000.00' },
);

export const creditFormSchema = z.object({
  limit: creditLimitField,
  days: z.number().int().positive({ error: 'Indica los días de crédito' }),
  extension: z.number().int().positive({ error: 'Indica la prórroga en días' }),
  remision_tolerance: z.number().int({
    error: 'Indica la tolerancia de remisión en días',
  }),
  requires_purchase_order: z.boolean(),
  is_blocked: z.boolean(),
});

export function creditFormToCreateBody(
  clientId: number,
  input: z.output<typeof creditFormSchema>,
): CreditCreateBody {
  return {
    client: clientId,
    limit: input.limit,
    days: input.days,
    extension: input.extension,
    remision_tolerance: input.remision_tolerance,
    requires_purchase_order: input.requires_purchase_order,
    is_blocked: input.is_blocked,
  };
}

export const clientContactFormSchema = z.object({
  name: catalogNameField('El nombre'),
  position: requiredStr('El puesto'),
  email: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.email({ error: 'Introduce un correo válido' })),
  phone: requiredStr('El teléfono'),
  whatsapp: requiredStr('El WhatsApp'),
  is_authorizer: z.boolean(),
  receives_quotes: z.boolean(),
  receives_oc_reminders: z.boolean(),
  receives_account_status: z.boolean(),
  is_billing_contact: z.boolean(),
  is_active: z.boolean(),
});

export function clientContactFormToCreateBody(
  clientId: number,
  input: z.output<typeof clientContactFormSchema>,
): ClientContactCreateBody {
  return {
    client: clientId,
    name: input.name,
    position: input.position,
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    is_authorizer: input.is_authorizer,
    receives_quotes: input.receives_quotes,
    receives_oc_reminders: input.receives_oc_reminders,
    receives_account_status: input.receives_account_status,
    is_billing_contact: input.is_billing_contact,
  };
}

export function clientContactFormToUpdateBody(
  clientId: number,
  input: z.output<typeof clientContactFormSchema>,
): ClientContactUpdateBody {
  return {
    ...clientContactFormToCreateBody(clientId, input),
    is_active: input.is_active,
  };
}

export type ClientContactFormStateFromSchema = z.infer<
  typeof clientContactFormSchema
>;

export const serviceCreateSchema = z.object({
  name: catalogNameField('El nombre').pipe(
    z.string().max(200, 'El nombre admite máximo 200 caracteres'),
  ),
  description: z.string().transform((s) => s.trim()).default(''),
  category: z.number().int().positive({ error: 'Selecciona una categoría' }),
  unit: z.enum(SERVICE_UNIT_VALUES, { error: 'Selecciona una unidad' }),
  warranty: z.boolean(),
});

export const categoryCreateSchema = z.object({
  name: catalogNameField('El nombre'),
});

export const supplierCreateSchema = z
  .object({
    name: catalogNameField('El nombre'),
    description: z.string(),
    phone: requiredStr('El teléfono'),
    email: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.email({ error: 'Introduce un correo válido' })),
    service_type: z
      .array(
        z.enum([
          'cranes',
          'mechanics',
          'road_assist',
          'forklifts',
          'flatbed',
          'transport',
          'other',
        ]),
      )
      .min(1, 'Selecciona al menos un tipo de servicio'),
    is_trusted: z.boolean(),
    notes: z.string(),
    latitude: z.string(),
    longitude: z.string(),
  })
  .superRefine((data, ctx) => {
    const lat = data.latitude.trim();
    const lng = data.longitude.trim();
    if (lat === '' && lng === '') return;
    if (lat === '' || lng === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Indica latitud y longitud, o deja ambos vacíos',
        path: lat === '' ? ['latitude'] : ['longitude'],
      });
      return;
    }
    const latNum = Number(lat.replace(/,/g, ''));
    const lngNum = Number(lng.replace(/,/g, ''));
    if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
      ctx.addIssue({
        code: 'custom',
        message: 'Latitud inválida',
        path: ['latitude'],
      });
    }
    if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
      ctx.addIssue({
        code: 'custom',
        message: 'Longitud inválida',
        path: ['longitude'],
      });
    }
  });

export const supplierReviewSchema = z.object({
  rating: z.number().min(1, 'Selecciona una calificación').max(5),
  comment: z.string(),
});

export const contractItemFormSchema = z.object({
  service: z.number().int().positive({ error: 'Selecciona un servicio' }),
  price: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'Indica el precio')),
  price_multiplier: z.string(),
  percentaje: z.string(),
  notes: z.string(),
});

export const contractHeaderUpdateSchema = z.object({
  notes: z.string(),
});

export function contractItemFormToCreateBody(
  input: z.output<typeof contractItemFormSchema>,
): ContractItemCreateBody {
  const body: ContractItemCreateBody = {
    service: input.service,
    price: input.price,
  };
  const pm = input.price_multiplier.trim();
  const pct = input.percentaje.trim();
  const notes = input.notes.trim();
  if (pm) body.price_multiplier = pm;
  if (pct) body.percentaje = pct;
  if (notes) body.notes = notes;
  return body;
}

export function contractItemFormToUpdateBody(
  input: z.output<typeof contractItemFormSchema>,
): ContractItemUpdateBody {
  return contractItemFormToCreateBody(input);
}

export function contractHeaderFormToUpdateBody(
  input: z.output<typeof contractHeaderUpdateSchema>,
): ContractUpdateBody {
  return {
    notes: input.notes,
  };
}

export function contractCreateBody(clientId: number): ContractCreateBody {
  return {
    client: clientId,
    notes: '',
  };
}
