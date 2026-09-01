import { describe, expect, it } from 'vitest';
import {
  parseRescueAdminDocInput,
  rescueAdminDocCopySchema,
  rescueAdminDocToBody,
} from '../../app/schemas/rescue-admin-doc';

describe('parseRescueAdminDocInput', () => {
  it('requires remittance or invoice folio', () => {
    const parsed = parseRescueAdminDocInput({
      remittance_folio: '  ',
      invoice_folio: '',
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a remittance folio', () => {
    const parsed = parseRescueAdminDocInput({
      remittance_folio: ' OC-1 ',
      invoice_folio: '',
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.remittance_folio).toBe('OC-1');
    expect(parsed.data.invoice_folio).toBeNull();
  });
});

describe('rescueAdminDocCopySchema', () => {
  it('maps empty oc_pdf to null and keeps extra rescues', () => {
    const parsed = rescueAdminDocCopySchema.safeParse({
      remittance_folio: 'OC-9',
      invoice_folio: '',
      extra_rescues: [12, 15],
      oc_pdf: '  ',
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.oc_pdf).toBeNull();
    expect(parsed.data.extra_rescues).toEqual([12, 15]);
  });

  it('rejects an invalid oc_pdf url', () => {
    const parsed = rescueAdminDocCopySchema.safeParse({
      remittance_folio: 'OC-9',
      invoice_folio: '',
      extra_rescues: [],
      oc_pdf: 'not-a-url',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('rescueAdminDocToBody', () => {
  it('sends oc_pdf with the folios body', () => {
    const parsed = rescueAdminDocCopySchema.parse({
      remittance_folio: 'OC-9',
      invoice_folio: 'F-1',
      extra_rescues: [4],
      oc_pdf: 'https://files.example/oc.pdf',
    });
    expect(rescueAdminDocToBody(parsed)).toEqual({
      remittance_folio: 'OC-9',
      invoice_folio: 'F-1',
      extra_rescues: [4],
      oc_pdf: 'https://files.example/oc.pdf',
    });
  });
});
