import * as z from 'zod';
import type {
  ContractCreateBody,
  ContractItemCreateBody,
  ContractItemUpdateBody,
  ContractUpdateBody,
} from '~/interfaces/catalogs/contract';

const requiredStr = (label: string) =>
  z.string().transform((s) => s.trim()).pipe(z.string().min(1, `${label} es obligatorio`));

const catalogNameField = (label: string) =>
  requiredStr(label).transform((value) => normalizeCatalogName(value));

export const companyCreateSchema = z.object({
  name: catalogNameField('El nombre'),
  business_name: requiredStr('La razón social'),
  rfc: requiredStr('El RFC'),
  phone: requiredStr('El teléfono'),
  email: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.email({ error: 'Introduce un correo válido' })),
  address: requiredStr('La dirección'),
  client_type: z.enum(['CASH', 'CREDIT'], {
    error: 'Selecciona un tipo de cliente',
  }),
  billing_type: z.enum(['DIRECT_INVOICE', 'MANUAL'], {
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
  company: z.number().int().positive({ error: 'Selecciona una compañía' }),
  seller: z.number().int().positive({ error: 'Indica el ID del vendedor' }),
  notes: z.string(),
});

export const serviceCreateSchema = z.object({
  name: catalogNameField('El nombre'),
  description: requiredStr('La descripción'),
  category: z.number().int().positive({ error: 'Selecciona una categoría' }),
  unit: requiredStr('La unidad'),
  warranty: z.boolean(),
});

export const categoryCreateSchema = z.object({
  name: catalogNameField('El nombre'),
});

export const supplierCreateSchema = z.object({
  name: catalogNameField('El nombre'),
  description: z.string(),
  phone: requiredStr('El teléfono'),
  email: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.email({ error: 'Introduce un correo válido' })),
  service_type: z.enum(
    ['cranes', 'mechanics', 'road_assist', 'forklifts', 'flatbed', 'transport', 'other'],
    { error: 'Selecciona un tipo de servicio' },
  ),
  is_trusted: z.boolean(),
  notes: z.string(),
  latitude: requiredStr('La latitud'),
  longitude: requiredStr('La longitud'),
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
