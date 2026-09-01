import { describe, expect, it } from 'vitest';
import { PENDING_INVOICE_DETAIL_COLUMNS } from '../../app/constants/pending-invoice';
import {
  parsePendingInvoiceAdminDoc,
  pendingInvoiceAdminDocToBody,
  pendingInvoiceFacturaSchema,
} from '../../app/schemas/pending-invoice';

describe('pendingInvoiceFacturaSchema', () => {
  it('requires a non-empty invoice folio', () => {
    expect(pendingInvoiceFacturaSchema.safeParse({ invoice_folio: '  ' }).success)
      .toBe(false);
    expect(pendingInvoiceFacturaSchema.parse({ invoice_folio: ' F-1 ' }))
      .toEqual({ invoice_folio: 'F-1' });
  });
});

describe('parsePendingInvoiceAdminDoc', () => {
  it('accepts oc_pdf without remittance', () => {
    const parsed = parsePendingInvoiceAdminDoc({
      invoice_folio: null,
      oc_pdf: 'https://files.example/oc.pdf',
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(pendingInvoiceAdminDocToBody(parsed.data)).toEqual({
      remittance_folio: null,
      invoice_folio: null,
      extra_rescues: [],
      oc_pdf: 'https://files.example/oc.pdf',
    });
  });

  it('accepts invoice_folio and keeps existing oc_pdf', () => {
    const parsed = parsePendingInvoiceAdminDoc({
      invoice_folio: ' F-9 ',
      oc_pdf: 'https://files.example/oc.pdf',
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(pendingInvoiceAdminDocToBody(parsed.data)).toEqual({
      remittance_folio: null,
      invoice_folio: 'F-9',
      extra_rescues: [],
      oc_pdf: 'https://files.example/oc.pdf',
    });
  });

  it('rejects an empty 1x1 payload', () => {
    expect(
      parsePendingInvoiceAdminDoc({ invoice_folio: '', oc_pdf: '' }).success,
    ).toBe(false);
  });
});

describe('PENDING_INVOICE_DETAIL_COLUMNS', () => {
  it('puts oc_pdf and factura first', () => {
    expect(PENDING_INVOICE_DETAIL_COLUMNS.slice(0, 2).map(column => column.id))
      .toEqual(['oc_pdf', 'factura']);
  });
});
