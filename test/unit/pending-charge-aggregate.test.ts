import { describe, expect, it } from 'vitest';
import type { PendingChargeRow } from '../../app/interfaces/invoicing/pending-charge';
import {
  filterPendingChargeRows,
  sortPendingChargeRows,
  summarizePendingChargeRows,
} from '../../app/utils/pending-charge-aggregate';

function buildRow(overrides: Partial<PendingChargeRow> = {}): PendingChargeRow {
  return {
    id: 1,
    cliente: 'TMS',
    compania: 'Grupo TMS',
    rfc: 'TMS7901019Q7',
    responsable: 'Ana Pérez',
    fecha_factura: '2026-08-11T17:45:56.876224Z',
    vencimiento: '2026-09-10',
    dias_vencidos: 0,
    status: 'bien',
    total: 100,
    ...overrides,
  };
}

describe('pending-charge-aggregate', () => {
  const rows = [
    buildRow(),
    buildRow({
      id: 2,
      cliente: 'Acme',
      rfc: 'ACM010101AAA',
      status: 'vencida',
      dias_vencidos: 12,
      total: 50,
    }),
  ];

  it('searches client, company, rfc and responsible', () => {
    expect(filterPendingChargeRows(rows, { search: 'acme' })).toHaveLength(1);
    expect(filterPendingChargeRows(rows, { search: 'tms790' })).toHaveLength(1);
    expect(filterPendingChargeRows(rows, { search: 'zzz' })).toHaveLength(0);
  });

  it('filters by cobranza status', () => {
    const result = filterPendingChargeRows(rows, { statuses: ['vencida'] });
    expect(result.map(row => row.id)).toEqual([2]);
  });

  it('summarizes loaded clients and totals', () => {
    expect(summarizePendingChargeRows(rows)).toEqual({
      clientes: 2,
      total: 150,
    });
  });

  it('sorts días vencidos client-side without an API field', () => {
    const sorted = sortPendingChargeRows(rows, 'dias_vencidos', true);
    expect(sorted.map(row => row.dias_vencidos)).toEqual([12, 0]);
  });

  it('keeps API order when no column is selected', () => {
    expect(sortPendingChargeRows(rows, null, true)).toBe(rows);
  });
});
