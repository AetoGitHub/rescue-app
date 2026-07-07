import { describe, expect, it } from 'vitest';
import {
  buildPendingInvoiceDetailQuery,
  emptyPendingInvoiceDetailFilters,
  hasActivePendingInvoiceDetailFilters,
  parsePendingInvoiceDetailFiltersFromRoute,
  parsePendingInvoiceMatrixMonths,
  pendingInvoiceDetailFiltersKey,
} from '../../app/utils/pending-invoice-filters';

describe('pending-invoice-filters', () => {
  it('buildPendingInvoiceDetailQuery omits empty values', () => {
    expect(buildPendingInvoiceDetailQuery(emptyPendingInvoiceDetailFilters())).toEqual(
      {},
    );
  });

  it('buildPendingInvoiceDetailQuery maps all active filters', () => {
    expect(
      buildPendingInvoiceDetailQuery({
        search: 'RES-2026',
        companyId: 1,
        sellerId: 3,
        operatorId: 5,
        month: 7,
        year: 2026,
        status: 'in_remittance',
        attention: 'needs_attention',
      }),
    ).toEqual({
      search: 'RES-2026',
      company: '1',
      seller: '3',
      operator: '5',
      month: '7',
      year: '2026',
      status: 'in_remittance',
      attention: 'needs_attention',
    });
  });

  it('parsePendingInvoiceDetailFiltersFromRoute reads query params', () => {
    expect(
      parsePendingInvoiceDetailFiltersFromRoute({
        search: 'ACME',
        company: '5',
        seller: '2',
        operator: '8',
        month: '9',
        year: '2026',
        status: 'unattended',
        attention: 'needs_attention',
      }),
    ).toEqual({
      search: 'ACME',
      companyId: 5,
      sellerId: 2,
      operatorId: 8,
      month: 9,
      year: 2026,
      status: 'unattended',
      attention: 'needs_attention',
    });
  });

  it('pendingInvoiceDetailFiltersKey is stable for cache keys', () => {
    expect(
      pendingInvoiceDetailFiltersKey({
        search: 'x',
        companyId: 1,
        sellerId: null,
        operatorId: null,
        month: null,
        year: null,
        status: null,
        attention: null,
      }),
    ).toEqual(['x', '1', '', '', '', '', '', '']);
  });

  it('hasActivePendingInvoiceDetailFilters detects active filters', () => {
    expect(hasActivePendingInvoiceDetailFilters(emptyPendingInvoiceDetailFilters())).toBe(
      false,
    );
    expect(
      hasActivePendingInvoiceDetailFilters({
        ...emptyPendingInvoiceDetailFilters(),
        search: 'folio',
      }),
    ).toBe(true);
  });

  it('parsePendingInvoiceMatrixMonths defaults and validates window', () => {
    expect(parsePendingInvoiceMatrixMonths(undefined)).toBe(6);
    expect(parsePendingInvoiceMatrixMonths('12')).toBe(12);
    expect(parsePendingInvoiceMatrixMonths('99')).toBe(6);
  });
});
