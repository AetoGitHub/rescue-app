import { describe, expect, it } from 'vitest';
import { PENDING_INVOICE_DETAIL_COLUMNS } from '../../app/constants/pending-invoice';

describe('PENDING_INVOICE_DETAIL_COLUMNS', () => {
  it('puts oc_pdf, OC and factura first', () => {
    expect(PENDING_INVOICE_DETAIL_COLUMNS.slice(0, 3).map(column => column.id))
      .toEqual(['oc_pdf', 'purchase_order', 'factura']);
  });
});
