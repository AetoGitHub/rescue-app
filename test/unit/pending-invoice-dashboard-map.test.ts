import { describe, expect, it } from 'vitest';
import type {
  PendingInvoiceByResponsibleApiRow,
  PendingInvoiceCompanyMatrixApiRow,
} from '../../app/interfaces/invoicing/pending-invoice';
import {
  mapPendingInvoiceByResponsibleRow,
  mapPendingInvoiceCompanyMatrix,
  mapPendingInvoiceDaysPromColor,
  pendingInvoiceCompanyQuery,
  pendingInvoiceCompanyQueryIds,
  pendingInvoiceCsvIdQuery,
  pendingInvoiceOrderingParam,
} from '../../app/utils/pending-invoice-dashboard-map';

describe('pendingInvoiceCompanyQuery', () => {
  it('returns a single id string', () => {
    expect(
      pendingInvoiceCompanyQuery([{ id: 4, name: 'A' }]),
    ).toBe('4');
  });

  it('returns a comma-separated list for multi-select', () => {
    expect(
      pendingInvoiceCompanyQuery([
        { id: 1, name: 'A' },
        { id: 0, name: 'fallback' },
        { id: 4, name: 'B' },
      ]),
    ).toBe('1,4');
  });

  it('returns undefined when there are no positive ids', () => {
    expect(pendingInvoiceCompanyQuery([])).toBeUndefined();
    expect(
      pendingInvoiceCompanyQuery([{ id: 0, name: 'Solo nombre' }]),
    ).toBeUndefined();
    expect(pendingInvoiceCompanyQueryIds([{ id: 0, name: 'x' }])).toEqual([]);
    expect(pendingInvoiceCsvIdQuery([{ id: 2, name: 'A' }, { id: 9, name: 'B' }])).toBe(
      '2,9',
    );
  });
});

describe('pendingInvoiceOrderingParam', () => {
  it('prefixes a minus for descending API fields', () => {
    expect(pendingInvoiceOrderingParam({ ordering: 'total' }, true)).toBe('-total');
    expect(pendingInvoiceOrderingParam({ ordering: 'folio' }, false)).toBe('folio');
  });

  it('inverts dias so more days maps to older dates', () => {
    expect(
      pendingInvoiceOrderingParam(
        { ordering: 'date', invertOrdering: true },
        true,
      ),
    ).toBe('date');
    expect(
      pendingInvoiceOrderingParam(
        { ordering: 'date', invertOrdering: true },
        false,
      ),
    ).toBe('-date');
  });
});

describe('mapPendingInvoiceDaysPromColor', () => {
  it('normalizes known colors', () => {
    expect(mapPendingInvoiceDaysPromColor('verde')).toBe('verde');
    expect(mapPendingInvoiceDaysPromColor('AMARILLO')).toBe('amarillo');
    expect(mapPendingInvoiceDaysPromColor('rojo')).toBe('rojo');
  });

  it('returns null for unknown values', () => {
    expect(mapPendingInvoiceDaysPromColor(null)).toBeNull();
    expect(mapPendingInvoiceDaysPromColor('azul')).toBeNull();
  });
});

describe('mapPendingInvoiceByResponsibleRow', () => {
  const base: PendingInvoiceByResponsibleApiRow = {
    id: 12,
    responsible_name: 'TMS',
    eventos: 91,
    sin_atender: 62,
    remision: 0,
    atencion: 0,
    dias_prom: 4,
    dias_prom_color: 'verde',
    dias_maximo: 6,
    subtotal: '173705.04',
    iva: 27792.8,
    total: '201497.84',
    porcentaje_facturado: 29.67,
  };

  it('maps the API payload without day columns', () => {
    expect(mapPendingInvoiceByResponsibleRow(base)).toEqual({
      id: 12,
      responsable: 'TMS',
      eventos: 91,
      sin_atender: 62,
      remision: 0,
      atencion: 0,
      subtotal: 173705.04,
      iva: 27792.8,
      total: 201497.84,
      porcentaje_facturado: 29.67,
    });
  });

  it('nulls counts/money to zero', () => {
    const mapped = mapPendingInvoiceByResponsibleRow({
      ...base,
      eventos: null,
      sin_atender: null,
      remision: null,
      atencion: null,
      subtotal: null,
      iva: null,
      total: null,
      porcentaje_facturado: null,
    });

    expect(mapped).toMatchObject({
      eventos: 0,
      sin_atender: 0,
      remision: 0,
      atencion: 0,
      subtotal: 0,
      iva: 0,
      total: 0,
      porcentaje_facturado: 0,
    });
  });
});

describe('mapPendingInvoiceCompanyMatrix', () => {
  const rows: PendingInvoiceCompanyMatrixApiRow[] = [
    {
      client_id: 12,
      client_name: 'TMS',
      responsible_name: null,
      meses: {
        '2026-07': { total: 0, eventos: 0 },
        '2026-08': { total: 195117.84, eventos: 89 },
      },
      total: 195117.84,
    },
    {
      client_id: 2,
      client_name: 'CLIENTE CON CREDITO',
      responsible_name: 'JOSE ANGEL COLIN',
      meses: {
        '2026-07': { total: 10, eventos: 1 },
        '2026-08': { total: 13.2, eventos: 2 },
      },
      total: 23.2,
    },
  ];

  it('builds month keys and sorts rows by total', () => {
    const matrix = mapPendingInvoiceCompanyMatrix(rows, 6, new Date(2026, 7, 1));
    expect(matrix.month_keys).toEqual(['2026-07', '2026-08']);
    expect(matrix.rows.map(row => row.cliente)).toEqual([
      'TMS',
      'CLIENTE CON CREDITO',
    ]);
    expect(matrix.totals.total).toBeCloseTo(195141.04);
    expect(matrix.totals.eventos).toBe(92);
  });

  it('maps client_name and null responsible as dash', () => {
    const matrix = mapPendingInvoiceCompanyMatrix([rows[0]!], 6);
    expect(matrix.rows[0]).toMatchObject({
      row_key: 'client:12',
      client_id: 12,
      cliente: 'TMS',
      responsable: '—',
      meses: {
        '2026-08': { monto: 195117.84, eventos: 89 },
      },
    });
  });

  it('maps responsible_name when present', () => {
    const matrix = mapPendingInvoiceCompanyMatrix([rows[1]!], 6);
    expect(matrix.rows[0]).toMatchObject({
      row_key: 'client:2',
      client_id: 2,
      cliente: 'CLIENTE CON CREDITO',
      responsable: 'JOSE ANGEL COLIN',
    });
  });

  it('falls back to a local month window when meses is empty', () => {
    const matrix = mapPendingInvoiceCompanyMatrix(
      [{ client_id: 1, client_name: 'Vacío', meses: {}, total: 0 }],
      3,
      new Date(2026, 0, 15),
    );
    expect(matrix.month_keys).toEqual(['2025-11', '2025-12', '2026-01']);
  });
});
