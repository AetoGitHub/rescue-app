import * as z from 'zod';
import type {
  RescueCreateBody,
  RescueQuoteLine,
  RescueServiceType,
} from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import {
  emptyCatalogDropdownSelection,
  type CatalogDropdownSelection,
} from '~/interfaces/shared/catalog-dropdown.interface';
import { isQuoteOptionalForServiceType } from '~/utils/rescue-request';
import { TMS_CLIENT_LABEL } from '~/constants/tms-portal-api';
const RESCUE_SERVICE_TYPES = [
  'rescue',
  'loan',
  'proyect',
  'direct_budget',
] as const;

const catalogSelectionSchema = z.object({
  value: z.number().int().positive().nullable(),
  label: z.string(),
});

const clientField = catalogSelectionSchema.refine(
  (s) => s.value != null,
  { error: 'Selecciona un cliente' },
);

const managerFieldOptional = catalogSelectionSchema;

export function parseRescueCoord(
  value: string | null | undefined,
): number | undefined {
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
    });

const coordFromNullable = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (v == null ? '' : String(v)),
    optionalCoordString(label, min, max),
  );

const serviceTypeField = z.enum(RESCUE_SERVICE_TYPES, {
  error: 'Selecciona un tipo de servicio',
});

const vehicleField = z
  .string()
  .transform((s) => s.trim())
  .optional()
  .default('');

export const rescueStepBasicsSchema = z
  .object({
    service_type: serviceTypeField,
    client: clientField,
    general_public: z.boolean(),
    vehicle: vehicleField,
    manager: managerFieldOptional,
    service_description: z.string().transform((s) => s.trim()),
  })
  .superRefine((data, ctx) => {
    if (data.manager.value == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecciona un gestor',
        path: ['manager'],
      });
    }
  });

export const rescueStepLocationSchema = z.object({
  location_latitude: coordFromNullable('La latitud', -90, 90),
  location_longitude: coordFromNullable('La longitud', -180, 180),
  location_description: z.string().transform((s) => s.trim()),
});

export const rescueStepSupplierSchema = z.object({
  supplier: z.number().int().positive().nullable().optional(),
});

const quoteBlameFieldSchema = z.object({
  original: z.string(),
  user_id: z.number(),
  username: z.string(),
});

const rescueQuoteLineSchema = z.object({
  id: z.string(),
  service: catalogSelectionSchema,
  quantity: z.number(),
  unit_cost: z.number(),
  contract_item_id: z.number().int().positive().nullable(),
  applied_price: z.number(),
  client_price: z.number().default(0),
  priceOverrideSource: z
    .enum(['none', 'client_price', 'applied_price'])
    .default('none'),
  blame_client_price: quoteBlameFieldSchema.nullable().default(null),
  blame_applied_price: quoteBlameFieldSchema.nullable().default(null),
});

type RescueQuoteLineInput = z.infer<typeof rescueQuoteLineSchema>;

function validateQuoteLineAtIndex(
  line: RescueQuoteLineInput,
  index: number,
  ctx: z.RefinementCtx,
) {
  if (line.service.value == null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Selecciona un servicio',
      path: ['quote_lines', index, 'service', 'value'],
    });
  }
  if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'La cantidad debe ser mayor a 0',
        path: ['quote_lines', index, 'quantity'],
      });
    }
    if (!Number.isFinite(line.unit_cost) || line.unit_cost < 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'El costo técnico unitario no puede ser negativo',
        path: ['quote_lines', index, 'unit_cost'],
      });
    }
    if (!Number.isFinite(line.client_price) || line.client_price < 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'El venta AETO unitario no puede ser negativo',
        path: ['quote_lines', index, 'client_price'],
      });
    }
}

function refineQuoteLines(
  quoteLines: RescueQuoteLineInput[],
  ctx: z.RefinementCtx,
  options: { required: boolean },
) {
  const hasFilledLine = quoteLines.some((line) => line.service.value != null);
  if (!hasFilledLine) {
    if (options.required) {
      ctx.addIssue({
        code: 'custom',
        message: 'Agrega al menos un servicio',
        path: ['quote_lines'],
      });
    }
    return;
  }

  quoteLines.forEach((line, index) => {
    if (line.service.value == null) return;
    validateQuoteLineAtIndex(line, index, ctx);
  });
}

function createRescueStepQuoteSchema(required: boolean) {
  return z
    .object({
      quote_lines: z.array(rescueQuoteLineSchema),
    })
    .superRefine((data, ctx) => {
      refineQuoteLines(data.quote_lines, ctx, { required });
    });
}

function createRescueStepQuoteWithSettingsSchema(required: boolean) {
  return z
    .object({
      quote_lines: z.array(rescueQuoteLineSchema),
      company_settings: z.custom<RescueCompanySettings | null>(),
    })
    .superRefine((data, ctx) => {
      refineQuoteLines(data.quote_lines, ctx, { required });
    });
}

/** @deprecated Use getRescueStepQuoteSchema(serviceType) */
export const rescueStepQuoteSchema = createRescueStepQuoteSchema(true);

/** @deprecated Use getRescueStepQuoteWithSettingsSchema(serviceType) */
export const rescueStepQuoteWithSettingsSchema =
  createRescueStepQuoteWithSettingsSchema(true);

export function getRescueStepQuoteSchema(serviceType: RescueServiceType) {
  return createRescueStepQuoteSchema(!isQuoteOptionalForServiceType(serviceType));
}

export function getRescueStepQuoteWithSettingsSchema(
  serviceType: RescueServiceType,
) {
  return createRescueStepQuoteWithSettingsSchema(
    !isQuoteOptionalForServiceType(serviceType),
  );
}

export function isTmsClient(
  client: { label?: string | null; name?: string | null } | null | undefined,
): boolean {
  const expected = TMS_CLIENT_LABEL.toLocaleLowerCase('es-MX');
  return [client?.label, client?.name].some(
    (value) => value?.trim().toLocaleLowerCase('es-MX') === expected,
  );
}

const TMS_INTERNAL_NOTES_REQUIRED =
  'Las notas internas son obligatorias para el cliente TMS';

function refineTmsInternalNotes(
  data: { client: { label: string }; internal_notes: string },
  ctx: z.RefinementCtx,
) {
  if (!isTmsClient(data.client)) return;
  if (data.internal_notes.length > 0) return;

  ctx.addIssue({
    code: 'custom',
    message: TMS_INTERNAL_NOTES_REQUIRED,
    path: ['internal_notes'],
  });
}

export const rescueStepSummarySchema = z
  .object({
    client: catalogSelectionSchema,
    internal_notes: z.string().transform((s) => s.trim()),
  })
  .superRefine(refineTmsInternalNotes);

export const rescueCreateFormSchema = z
  .object({
    service_type: serviceTypeField,
    client: clientField,
    general_public: z.boolean(),
    vehicle: vehicleField,
    manager: managerFieldOptional,
    location_latitude: coordFromNullable('La latitud', -90, 90),
    location_longitude: coordFromNullable('La longitud', -180, 180),
    location_description: z.string().transform((s) => s.trim()),
    service_description: z.string().transform((s) => s.trim()),
    supplier: z.number().int().positive().nullable().optional(),
    internal_notes: z.string().transform((s) => s.trim()),
    quote_lines: z.array(rescueQuoteLineSchema),
  })
  .superRefine((data, ctx) => {
    if (data.manager.value == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecciona un gestor',
        path: ['manager'],
      });
    }

    refineQuoteLines(data.quote_lines, ctx, {
      required: !isQuoteOptionalForServiceType(data.service_type),
    });
    refineTmsInternalNotes(data, ctx);
  });

export type RescueCreateFormOutput = z.output<typeof rescueCreateFormSchema>;

export type ClientCreditSnapshot = {
  client_type: string;
  credit_limit: string | null;
  credit_available: number | null;
};

export type RescueRequestFormState = {
  service_type: RescueServiceType;
  client: CatalogDropdownSelection;
  general_public: boolean;
  vehicle: string;
  service_description: string;
  location_latitude: string | null;
  location_longitude: string | null;
  location_description: string;
  supplier: number | null;
  supplierLabel: string;
  manager: CatalogDropdownSelection;
  internal_notes: string;
  client_credit_snapshot: ClientCreditSnapshot | null;
  /** Client's assigned seller; null when none — zeros seller commissions in quotes. */
  client_seller_id: number | null;
  quote_lines: RescueQuoteLine[];
  company_settings: RescueCompanySettings | null;
};

export function emptyRescueRequestState(): RescueRequestFormState {
  return {
    service_type: 'rescue',
    client: emptyCatalogDropdownSelection(),
    general_public: false,
    vehicle: '',
    service_description: '',
    location_latitude: null,
    location_longitude: null,
    location_description: '',
    supplier: null,
    supplierLabel: '',
    manager: emptyCatalogDropdownSelection(),
    internal_notes: '',
    client_credit_snapshot: null,
    client_seller_id: null,
    quote_lines: initialQuoteLinesForServiceType('rescue'),
    company_settings: null,
  };
}

export function getStepSchemaForIndex(
  stepIndex: number,
  serviceType: RescueServiceType,
) {
  switch (stepIndex) {
    case 0:
      return rescueStepBasicsSchema;
    case 1:
      return rescueStepLocationSchema;
    case 2:
      return rescueStepSupplierSchema;
    case 3:
      return getRescueStepQuoteSchema(serviceType);
    case 4:
      return rescueStepSummarySchema;
    default:
      return rescueStepBasicsSchema;
  }
}

export function rescueFormToCreateBody(
  data: RescueCreateFormOutput,
): RescueCreateBody {
  const latitude = String(data.location_latitude ?? '').trim();
  const longitude = String(data.location_longitude ?? '').trim();

  return {
    service_type: data.service_type,
    client: data.client.value!,
    general_public: data.general_public,
    vehicle: String(data.vehicle ?? '').trim(),
    service_description: data.service_description,
    supplier: data.supplier ?? null,
    operator: data.manager.value,
    location_latitude: latitude || null,
    location_longitude: longitude || null,
    location_description: data.location_description,
    internal_notes: data.internal_notes,
  };
}
