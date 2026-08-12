import { describe, expect, it } from 'vitest';
import type { PendingInvoiceRow } from '../../app/interfaces/invoicing/pending-invoice';
import {
  buildPendingInvoiceMatrix,
  buildPendingInvoiceMonthWindow,
  buildPendingInvoiceSellerRows,
  collectPendingInvoiceCompanies,
  filterPendingInvoiceRows,
  pendingInvoiceColumnOptions,
  sortPendingInvoiceRows,
  summarizePendingInvoiceRows,
} from '../../app/utils/pending-invoice-aggregate';

function buildRow(overrides: Partial<PendingInvoiceRow> = {}): PendingInvoiceRow {
  return {
    id: 1,
    folio: 'AEB-0001',
    compania_grupo: 'Grupo Bajío',
    compania: 'Auto Express del Bajío',
    responsable: 'Diego Torres',
    unidad: 'AEB-101',
    autorizador: 'Ing. Ramiro Cano',
    mes: 'Feb',
    mes_key: '2026-02',
    fecha: '2026-02-10T12:00:00.000Z',
    dias: 40,
    status: 'Sin atender',
    descripcion: 'Rescate de tractocamión',
    costo_tecnico: 850,
    subtotal: 1000,
    iva: 160,
    total: 1160,
    evidencia_rescate: true,
    evidencia_pagos: false,
    oc: null,
    ...overrides,
  };
}

describe('pending-invoice-aggregate', () => {
  describe('filterPendingInvoiceRows', () => {
    const rows = [
      buildRow({ id: 1 }),
      buildRow({
        id: 2,
        compania: 'Taller Mecánico Ruiz',
        responsable: 'Lucía Ramírez',
        autorizador: 'Sr. Efraín Ruiz',
        folio: 'TMR-0001',
        unidad: 'TMR-204',
      }),
    ];

    it('returns every row when no filter is set', () => {
      expect(filterPendingInvoiceRows(rows)).toHaveLength(2);
    });

    it('filters by company', () => {
      const result = filterPendingInvoiceRows(rows, {
        companies: ['Taller Mecánico Ruiz'],
      });
      expect(result.map(row => row.id)).toEqual([2]);
    });

    it('searches across folio, company, unit and authorizer', () => {
      expect(filterPendingInvoiceRows(rows, { search: 'tmr-204' })).toHaveLength(1);
      expect(filterPendingInvoiceRows(rows, { search: 'ramiro' })).toHaveLength(1);
      expect(filterPendingInvoiceRows(rows, { search: 'zzz' })).toHaveLength(0);
    });

    it('applies column filters as an intersection', () => {
      const result = filterPendingInvoiceRows(rows, {
        columnFilters: {
          responsable: ['Diego Torres'],
          status: ['Sin atender'],
        },
      });
      expect(result.map(row => row.id)).toEqual([1]);
    });

    it('ignores empty column selections', () => {
      expect(
        filterPendingInvoiceRows(rows, { columnFilters: { responsable: [] } }),
      ).toHaveLength(2);
    });
  });

  describe('sortPendingInvoiceRows', () => {
    const rows = [
      buildRow({ id: 1, dias: 10, total: 500, costo_tecnico: 400 }),
      buildRow({ id: 2, dias: 90, total: 100, costo_tecnico: 80 }),
    ];

    it('sorts numerically in both directions', () => {
      expect(sortPendingInvoiceRows(rows, 'dias', true).map(r => r.id)).toEqual([2, 1]);
      expect(sortPendingInvoiceRows(rows, 'dias', false).map(r => r.id)).toEqual([1, 2]);
    });

    it('sorts money columns by value, not by formatted text', () => {
      expect(sortPendingInvoiceRows(rows, 'total', true).map(r => r.id)).toEqual([1, 2]);
      expect(
        sortPendingInvoiceRows(rows, 'costo_tecnico', true).map(r => r.id),
      ).toEqual([1, 2]);
    });

    it('returns the original array when no column is active', () => {
      expect(sortPendingInvoiceRows(rows, null, true)).toBe(rows);
    });
  });

  describe('pendingInvoiceColumnOptions', () => {
    it('lists distinct values once', () => {
      const options = pendingInvoiceColumnOptions(
        [buildRow(), buildRow({ id: 2 }), buildRow({ id: 3, responsable: 'Ana' })],
        'responsable',
      );
      expect(options.map(option => option.value)).toEqual(['Ana', 'Diego Torres']);
    });

    it('labels evidence columns', () => {
      expect(pendingInvoiceColumnOptions([buildRow()], 'evidencia_pagos')).toEqual([
        { value: 'no', label: 'Sin evidencia de pagos' },
      ]);
      expect(
        pendingInvoiceColumnOptions([buildRow()], 'evidencia_rescate'),
      ).toEqual([{ value: 'si', label: 'Con evidencia de rescate' }]);
    });
  });

  describe('summarizePendingInvoiceRows', () => {
    it('adds up events and amounts', () => {
      expect(summarizePendingInvoiceRows([buildRow(), buildRow({ id: 2 })])).toEqual({
        eventos: 2,
        subtotal: 2000,
        iva: 320,
        total: 2320,
      });
    });

    it('returns zeros for an empty list', () => {
      expect(summarizePendingInvoiceRows([])).toEqual({
        eventos: 0,
        subtotal: 0,
        iva: 0,
        total: 0,
      });
    });
  });

  describe('buildPendingInvoiceSellerRows', () => {
    const rows = [
      buildRow({ id: 1, dias: 20, status: 'Sin atender' }),
      buildRow({ id: 2, dias: 80, status: 'En remisión', oc: null }),
      buildRow({
        id: 3,
        responsable: 'Lucía Ramírez',
        total: 5000,
        subtotal: 4310,
        iva: 690,
      }),
    ];

    it('groups by seller and orders by amount descending', () => {
      const result = buildPendingInvoiceSellerRows(rows);
      expect(result.map(row => row.responsable)).toEqual([
        'Lucía Ramírez',
        'Diego Torres',
      ]);
    });

    it('counts statuses, attention flags and day stats', () => {
      const diego = buildPendingInvoiceSellerRows(rows).find(
        row => row.responsable === 'Diego Torres',
      );
      expect(diego).toMatchObject({
        eventos: 2,
        sin_atender: 1,
        remision: 1,
        atencion: 1,
        dias_prom: 50,
        dias_max: 80,
      });
    });
  });

  describe('buildPendingInvoiceMonthWindow', () => {
    it('returns the last N months in ascending order', () => {
      expect(buildPendingInvoiceMonthWindow(3, new Date(2026, 0, 15))).toEqual([
        '2025-11',
        '2025-12',
        '2026-01',
      ]);
    });
  });

  describe('buildPendingInvoiceMatrix', () => {
    const reference = new Date(2026, 1, 15);
    const rows = [
      buildRow({ id: 1, mes_key: '2026-02', total: 1000 }),
      buildRow({ id: 2, mes_key: '2026-01', total: 500 }),
      buildRow({
        id: 3,
        mes_key: '2026-02',
        total: 300,
        autorizador: 'Lic. Patricia Vela',
      }),
      buildRow({ id: 4, mes_key: '2020-01', total: 999 }),
    ];

    it('keeps only months inside the window', () => {
      const matrix = buildPendingInvoiceMatrix(rows, 3, reference);
      expect(matrix.month_keys).toEqual(['2025-12', '2026-01', '2026-02']);
      expect(matrix.totals.eventos).toBe(3);
      expect(matrix.totals.total).toBe(1800);
    });

    it('aggregates amounts and events per month cell', () => {
      const matrix = buildPendingInvoiceMatrix(rows, 3, reference);
      const company = matrix.rows[0];
      expect(company?.meses['2026-02']).toEqual({ monto: 1300, eventos: 2 });
      expect(company?.meses['2026-01']).toEqual({ monto: 500, eventos: 1 });
    });

    it('breaks each company down by authorizer', () => {
      const matrix = buildPendingInvoiceMatrix(rows, 3, reference);
      expect(matrix.rows[0]?.autorizadores.map(row => row.autorizador)).toEqual([
        'Ing. Ramiro Cano',
        'Lic. Patricia Vela',
      ]);
    });
  });

  describe('collectPendingInvoiceCompanies', () => {
    it('returns sorted unique company names', () => {
      expect(
        collectPendingInvoiceCompanies([
          buildRow({ compania: 'Beta' }),
          buildRow({ id: 2, compania: 'Alpha' }),
          buildRow({ id: 3, compania: 'Beta' }),
        ]),
      ).toEqual(['Alpha', 'Beta']);
    });
  });
});
