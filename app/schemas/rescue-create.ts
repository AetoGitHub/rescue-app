import * as z from 'zod';
import type {
  RescueCreateBody,
  RescueQuoteLine,
  RescueServiceType,
} from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import { getContractItemById } from '~/utils/rescue-company-settings';
import {
  hasExtendedRescueWizardFlow,
  isQuoteOptionalForServiceType,
} from '~/utils/rescue-request';
const RESCUE_SERVICE_TYPES = [
  'rescue',
  'loan',
  'proyect',
  'direct_budget',
] as const;

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

const requiredCoordFromNullable = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (v == null ? '' : String(v)),
    z
      .string()
      .transform((s) => s.trim())
      .superRefine((s, ctx) => {
        if (s === '') {
          ctx.addIssue({
            code: 'custom',
            message: `${label} es obligatoria`,
          });
          return;
        }
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
      }),
  );

const serviceTypeField = z.enum(RESCUE_SERVICE_TYPES, {
  error: 'Selecciona un tipo de servicio',
});

const clientField = z.number().int().positive({ error: 'Selecciona un cliente' });

const serialNumberField = z
  .string()
  .transform((s) => s.trim())
  .optional()
  .default('');

const managerFieldOptional = z.number().int().positive().optional();

export const rescueStepBasicsSchema = z
  .object({
    service_type: serviceTypeField,
    client: clientField,
    general_public: z.boolean(),
    serialNumber: serialNumberField,
    manager: managerFieldOptional,
  })
  .superRefine((data, ctx) => {
    if (data.manager == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecciona un gestor',
        path: ['manager'],
      });
    }
  });

export const rescueStepLocationSchema = z.object({
  location_latitude: requiredCoordFromNullable('La latitud', -90, 90),
  location_longitude: requiredCoordFromNullable('La longitud', -180, 180),
  location_description: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, { error: 'Indica la descripción del lugar' })),
  service_description: z.string().transform((s) => s.trim()),
});

export const rescueStepSupplierSchema = z.object({
  supplier: z.number().int().positive().nullable().optional(),
});

const rescueQuoteLineSchema = z.object({
  id: z.string(),
  service_id: z.number().int().positive().nullable(),
  service_label: z.string(),
  quantity: z.number(),
  unit_cost: z.number(),
  contract_item_id: z.number().int().positive().nullable(),
});

type RescueQuoteLineInput = z.infer<typeof rescueQuoteLineSchema>;

function validateQuoteLineAtIndex(
  line: RescueQuoteLineInput,
  index: number,
  settings: RescueCompanySettings | null | undefined,
  ctx: z.RefinementCtx,
) {
  if (line.service_id == null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Selecciona un servicio',
      path: ['quote_lines', index, 'service_id'],
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
        message: 'El pago unitario no puede ser negativo',
        path: ['quote_lines', index, 'unit_cost'],
      });
    }
    if (line.contract_item_id != null) {
      const item = getContractItemById(settings, line.contract_item_id);
      if (item == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'La variante de convenio ya no está disponible',
          path: ['quote_lines', index, 'contract_item_id'],
        });
      } else if (line.service_id != null && item.service_id !== line.service_id) {
        ctx.addIssue({
          code: 'custom',
          message: 'El servicio no coincide con el convenio seleccionado',
          path: ['quote_lines', index, 'service_id'],
        });
      }
    }
}

function refineQuoteLines(
  quoteLines: RescueQuoteLineInput[],
  settings: RescueCompanySettings | null | undefined,
  ctx: z.RefinementCtx,
  options: { required: boolean },
) {
  const hasFilledLine = quoteLines.some((line) => line.service_id != null);
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
    if (line.service_id == null) return;
    validateQuoteLineAtIndex(line, index, settings, ctx);
  });
}

function createRescueStepQuoteSchema(required: boolean) {
  return z
    .object({
      quote_lines: z.array(rescueQuoteLineSchema),
    })
    .superRefine((data, ctx) => {
      refineQuoteLines(data.quote_lines, undefined, ctx, { required });
    });
}

function createRescueStepQuoteWithSettingsSchema(required: boolean) {
  return z
    .object({
      quote_lines: z.array(rescueQuoteLineSchema),
      company_settings: z.custom<RescueCompanySettings | null>(),
    })
    .superRefine((data, ctx) => {
      refineQuoteLines(
        data.quote_lines,
        data.company_settings,
        ctx,
        { required },
      );
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

export const rescueStepSummarySchema = z.object({
  internal_notes: z.string().transform((s) => s.trim()),
});

export const rescueCreateFormSchema = z
  .object({
    service_type: serviceTypeField,
    client: clientField,
    general_public: z.boolean(),
    serialNumber: serialNumberField,
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
    if (data.manager == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecciona un gestor',
        path: ['manager'],
      });
    }

    refineQuoteLines(data.quote_lines, undefined, ctx, {
      required: !isQuoteOptionalForServiceType(data.service_type),
    });

    if (!hasExtendedRescueWizardFlow(data.service_type)) {
      return;
    }
    const lat = parseRescueCoord(
      data.location_latitude as string | null | undefined,
    );
    const lng = parseRescueCoord(
      data.location_longitude as string | null | undefined,
    );
    if (lat == null || lng == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indica la ubicación en el mapa',
        path: ['location_latitude'],
      });
    }
    if (!data.location_description) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indica la descripción del lugar',
        path: ['location_description'],
      });
    }
  });

export type RescueCreateFormOutput = z.output<typeof rescueCreateFormSchema>;

export type ClientCreditSnapshot = {
  client_type: string;
  credit_limit: string | null;
  credit_available: number | null;
};

export type RescueRequestFormState = {
  service_type: RescueServiceType;
  client: number | undefined;
  general_public: boolean;
  serialNumber: string;
  service_description: string;
  location_latitude: string | null;
  location_longitude: string | null;
  location_description: string;
  supplier: number | null;
  supplierLabel: string;
  manager: number | undefined;
  managerLabel: string;
  internal_notes: string;
  clientLabel: string;
  client_credit_snapshot: ClientCreditSnapshot | null;
  quote_lines: RescueQuoteLine[];
  company_settings: RescueCompanySettings | null;
};

export function emptyRescueRequestState(): RescueRequestFormState {
  return {
    service_type: 'rescue',
    client: undefined,
    general_public: false,
    serialNumber: '',
    service_description: '',
    location_latitude: null,
    location_longitude: null,
    location_description: '',
    supplier: null,
    supplierLabel: '',
    manager: undefined,
    managerLabel: '',
    internal_notes: '',
    clientLabel: '',
    client_credit_snapshot: null,
    quote_lines: initialQuoteLinesForServiceType('rescue'),
    company_settings: null,
  };
}

export function getStepSchemaForIndex(
  stepIndex: number,
  serviceType: RescueServiceType,
) {
  if (hasExtendedRescueWizardFlow(serviceType)) {
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
  if (stepIndex === 0) return rescueStepBasicsSchema;
  if (stepIndex === 1) return getRescueStepQuoteSchema(serviceType);
  return rescueStepSummarySchema;
}

export function rescueFormToCreateBody(
  data: RescueCreateFormOutput,
): RescueCreateBody {
  const serial = String(data.serialNumber ?? '').trim();

  return {
    service_type: data.service_type,
    client: data.client,
    general_public: data.general_public,
    ...(serial ? { serial_number: serial } : {}),
    service_description: data.service_description,
    supplier: data.supplier ?? null,
    operator: data.manager ?? null,
    location_latitude: String(data.location_latitude ?? '').trim(),
    location_longitude: String(data.location_longitude ?? '').trim(),
    location_description: data.location_description,
    internal_notes: data.internal_notes,
  };
}
