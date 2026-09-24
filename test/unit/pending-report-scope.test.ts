import { describe, expect, it } from 'vitest';
import {
  PENDING_INVOICE_DETAIL_COLUMNS,
  pendingInvoiceDetailColumns,
} from '../../app/constants/pending-invoice';

describe('pendingInvoiceDetailColumns', () => {
  it('keeps every column for admin', () => {
    expect(pendingInvoiceDetailColumns('admin')).toBe(PENDING_INVOICE_DETAIL_COLUMNS);
  });

  it('drops technical cost for the client portal', () => {
    const ids = pendingInvoiceDetailColumns('client').map(column => column.id);
    expect(ids).not.toContain('costo_tecnico');
    expect(ids).toContain('subtotal');
    expect(
      pendingInvoiceDetailColumns('client').some(
        column => column.ordering === 'technical_cost',
      ),
    ).toBe(false);
  });
});
