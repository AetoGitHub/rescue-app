import { describe, expect, it } from 'vitest';
import {
  getRescueStepQuoteSchema,
  getRescueStepQuoteWithSettingsSchema,
  isTmsClient,
  rescueCreateFormSchema,
  rescueStepSummarySchema,
  rescueStepSupplierSchema,
} from '~/schemas/rescue-create';
import {
  catalogDropdownSelection,
  emptyCatalogDropdownSelection,
} from '~/interfaces/shared/catalog-dropdown.interface';
import { emptyQuoteLinePriceFields } from '~/utils/rescue-quote-lines';

const emptyQuoteLine = {
  id: 'line-1',
  service: emptyCatalogDropdownSelection(),
  quantity: 1,
  unit_cost: 0,
  contract_item_id: null as number | null,
  ...emptyQuoteLinePriceFields(),
};

const validQuoteLine = {
  id: 'line-1',
  service: catalogDropdownSelection(1, 'Grúa'),
  quantity: 2,
  unit_cost: 500,
  contract_item_id: null as number | null,
  ...emptyQuoteLinePriceFields(),
};

const baseFormFields = {
  client: { value: 1, label: 'Cliente' },
  general_public: false,
  vehicle: '',
  manager: { value: 1, label: 'Gestor' },
  location_latitude: '',
  location_longitude: '',
  location_description: '',
  service_description: '',
  supplier: null,
  internal_notes: '',
};

describe('getRescueStepQuoteSchema', () => {
  it('allows empty quote_lines for rescue', () => {
    const result = getRescueStepQuoteSchema('rescue').safeParse({
      quote_lines: [],
    });
    expect(result.success).toBe(true);
  });

  it('allows empty quote_lines for proyect', () => {
    const result = getRescueStepQuoteSchema('proyect').safeParse({
      quote_lines: [],
    });
    expect(result.success).toBe(true);
  });

  it('allows a blank placeholder row for optional types', () => {
    const result = getRescueStepQuoteSchema('rescue').safeParse({
      quote_lines: [emptyQuoteLine],
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one filled line for direct_budget', () => {
    const result = getRescueStepQuoteSchema('direct_budget').safeParse({
      quote_lines: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects blank-only rows for loan', () => {
    const result = getRescueStepQuoteSchema('loan').safeParse({
      quote_lines: [emptyQuoteLine],
    });
    expect(result.success).toBe(false);
  });

  it('validates quantity and unit_cost on filled lines', () => {
    const result = getRescueStepQuoteSchema('rescue').safeParse({
      quote_lines: [
        {
          ...validQuoteLine,
          quantity: 0,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative venta AETO unitario', () => {
    const result = getRescueStepQuoteSchema('rescue').safeParse({
      quote_lines: [
        {
          ...validQuoteLine,
          client_price: -1,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('getRescueStepQuoteWithSettingsSchema', () => {
  it('uses optional rules for rescue with settings payload', () => {
    const result = getRescueStepQuoteWithSettingsSchema('rescue').safeParse({
      quote_lines: [],
      company_settings: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('rescueStepSupplierSchema', () => {
  it('allows null or omitted supplier on the optional step', () => {
    expect(rescueStepSupplierSchema.safeParse({ supplier: null }).success).toBe(true);
    expect(rescueStepSupplierSchema.safeParse({}).success).toBe(true);
  });
});

describe('rescueCreateFormSchema quote_lines', () => {
  it('allows empty quote on proyect submit without location', () => {
    const result = rescueCreateFormSchema.safeParse({
      ...baseFormFields,
      service_type: 'proyect',
      quote_lines: [],
    });
    expect(result.success).toBe(true);
  });

  it('allows empty location on rescue submit', () => {
    const result = rescueCreateFormSchema.safeParse({
      ...baseFormFields,
      service_type: 'rescue',
      quote_lines: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty quote on direct_budget submit', () => {
    const result = rescueCreateFormSchema.safeParse({
      ...baseFormFields,
      service_type: 'direct_budget',
      quote_lines: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty quote on loan submit', () => {
    const result = rescueCreateFormSchema.safeParse({
      ...baseFormFields,
      service_type: 'loan',
      quote_lines: [],
    });
    expect(result.success).toBe(false);
  });

  it('allows loan submit with filled quote and no location', () => {
    const result = rescueCreateFormSchema.safeParse({
      ...baseFormFields,
      service_type: 'loan',
      quote_lines: [validQuoteLine],
    });
    expect(result.success).toBe(true);
  });
});

describe('TMS client internal notes', () => {
  it('detects TMS by label or name, ignoring case and spaces', () => {
    expect(isTmsClient({ label: 'TMS' })).toBe(true);
    expect(isTmsClient({ label: ' tms ' })).toBe(true);
    expect(isTmsClient({ name: 'Tms' })).toBe(true);
    expect(isTmsClient({ label: 'Cliente' })).toBe(false);
    expect(isTmsClient({ label: 'ATMS' })).toBe(false);
  });

  it('requires internal notes for TMS on the summary step', () => {
    const empty = rescueStepSummarySchema.safeParse({
      client: { value: 12, label: 'TMS' },
      internal_notes: '   ',
    });
    expect(empty.success).toBe(false);
    expect(empty.error?.issues[0]?.path).toEqual(['internal_notes']);

    const filled = rescueStepSummarySchema.safeParse({
      client: { value: 12, label: 'TMS' },
      internal_notes: 'Folio de orden 2616071',
    });
    expect(filled.success).toBe(true);
  });

  it('rejects TMS internal notes shorter than 5 characters after trimming', () => {
    const result = rescueStepSummarySchema.safeParse({
      client: { value: 12, label: 'TMS' },
      internal_notes: '  ab  ',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['internal_notes']);
  });

  it('trims internal notes before validating TMS length', () => {
    const result = rescueStepSummarySchema.safeParse({
      client: { value: 12, label: 'TMS' },
      internal_notes: '  folio  ',
    });
    expect(result.success).toBe(true);
  });

  it('keeps internal notes optional for other clients', () => {
    const result = rescueStepSummarySchema.safeParse({
      client: { value: 1, label: 'Cliente' },
      internal_notes: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects TMS create when internal notes are empty', () => {
    const result = rescueCreateFormSchema.safeParse({
      ...baseFormFields,
      client: { value: 12, label: 'TMS' },
      service_type: 'rescue',
      quote_lines: [],
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path[0] === 'internal_notes'),
    ).toBe(true);
  });
});
