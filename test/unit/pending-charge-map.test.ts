import { describe, expect, it } from 'vitest';
import type { PendingChargeApiRow } from '../../app/interfaces/invoicing/pending-charge';
import {
  mapPendingChargeApiRow,
  mapPendingChargeStatus,
} from '../../app/utils/pending-charge-map';

function buildApiRow(
  overrides: Partial<PendingChargeApiRow> = {},
): PendingChargeApiRow {
  return {
    id: 12,
    company_name: 'TMS',
    client_name: 'TMS',
    rfc: 'TMS7901019Q7',
    responsible_name: null,
    invoice_date: '2026-08-11T17:45:56.876224Z',
    due_date: '2026-09-10',
    days_overdue: 0,
    status: 'bien',
    total: '345016.23',
    ...overrides,
  };
}

describe('pending-charge-map', () => {
  it('maps API fields into the UI row', () => {
    const row = mapPendingChargeApiRow(buildApiRow());

    expect(row).toMatchObject({
      id: 12,
      cliente: 'TMS',
      compania: 'TMS',
      rfc: 'TMS7901019Q7',
      responsable: '—',
      fecha_factura: '2026-08-11T17:45:56.876224Z',
      vencimiento: '2026-09-10',
      dias_vencidos: 0,
      status: 'bien',
      total: 345016.23,
    });
  });

  it('rejects rows without a valid client id', () => {
    expect(() => mapPendingChargeApiRow(buildApiRow({ id: 0 }))).toThrow(
      'no tiene un ID válido',
    );
  });

  it('maps known statuses and treats null as sin crédito', () => {
    expect(mapPendingChargeStatus('vencida')).toBe('vencida');
    expect(mapPendingChargeStatus('POR_VENCER')).toBe('por_vencer');
    expect(mapPendingChargeStatus('bien')).toBe('bien');
    expect(mapPendingChargeStatus(null)).toBe('sin_credito');
    expect(mapPendingChargeStatus('')).toBe('sin_credito');
  });

  it('clamps negative days overdue to zero', () => {
    expect(mapPendingChargeApiRow(buildApiRow({ days_overdue: -3 })).dias_vencidos).toBe(
      0,
    );
  });
});
