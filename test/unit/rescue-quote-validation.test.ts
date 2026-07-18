import { describe, expect, it } from 'vitest';
import {
  getRescueStepQuoteSchema,
  getRescueStepQuoteWithSettingsSchema,
  rescueCreateFormSchema,
  rescueStepSupplierSchema,
} from '~/schemas/rescue-create';

const emptyQuoteLine = {
  id: 'line-1',
  service_id: null as number | null,
  service_label: '',
  quantity: 1,
  unit_cost: 0,
  contract_item_id: null as number | null,
  applied_price: 0,
};

const validQuoteLine = {
  id: 'line-1',
  service_id: 1,
  service_label: 'Grúa',
  quantity: 2,
  unit_cost: 500,
  contract_item_id: null as number | null,
  applied_price: 0,
};

const baseFormFields = {
  client: 1,
  general_public: false,
  serialNumber: '',
  manager: 1,
  location_latitude: '',
  location_longitude: '',
  location_description: '',
  service_description: '',
  supplier: null,
  internal_notes: '',
};

const extendedFlowLocationFields = {
  location_latitude: '19.4326',
  location_longitude: '-99.1332',
  location_description: 'CDMX',
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
  it('allows empty quote on proyect submit with required location', () => {
    const result = rescueCreateFormSchema.safeParse({
      ...baseFormFields,
      ...extendedFlowLocationFields,
      service_type: 'proyect',
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
});
