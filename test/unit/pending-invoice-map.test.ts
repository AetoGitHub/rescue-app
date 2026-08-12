import { describe, expect, it } from 'vitest';
import type { PendingInvoiceApiRow } from '../../app/interfaces/invoicing/pending-invoice';
import {
  daysSincePendingInvoiceDate,
  mapPendingInvoiceApiRow,
  monthKeyFromPendingInvoiceDate,
} from '../../app/utils/pending-invoice-map';
import {
  pendingInvoiceEvidenceType,
  pendingInvoiceEvidenceZipFilename,
} from '../../app/utils/pending-invoice-evidence';

function buildApiRow(
  overrides: Partial<PendingInvoiceApiRow> = {},
): PendingInvoiceApiRow {
  return {
    id: 227,
    folio: 'PRE-2026-00227',
    company_name: 'TMS',
    client_name: 'CLIENTE CON CREDITO',
    operator_name: 'ZYANYA JAZMIN',
    date: '2026-08-01T18:14:48.620390Z',
    vehicle: '1621',
    authorizer: '',
    service_description: 'Llanta ponchada',
    sub_total: '270.00',
    iva: 43.2,
    total: '313.20',
    technical_cost: '250.00',
    ...overrides,
  };
}

describe('pending-invoice-map', () => {
  const reference = new Date('2026-08-12T12:00:00.000Z');

  it('maps API money fields and names into the UI row', () => {
    const row = mapPendingInvoiceApiRow(buildApiRow({ id: 227 }), reference);

    expect(row).toMatchObject({
      id: 227,
      folio: 'PRE-2026-00227',
      compania: 'TMS',
      compania_grupo: 'CLIENTE CON CREDITO',
      responsable: 'ZYANYA JAZMIN',
      unidad: '1621',
      autorizador: '—',
      descripcion: 'Llanta ponchada',
      costo_tecnico: 250,
      subtotal: 270,
      iva: 43.2,
      total: 313.2,
      mes_key: '2026-08',
      dias: 11,
    });
  });

  it('rejects rows without a valid rescue id', () => {
    expect(() =>
      mapPendingInvoiceApiRow(buildApiRow({ id: 0 }), reference),
    ).toThrow('no tiene un ID válido');
  });

  it('maps admin_status when the backend sends it', () => {
    expect(
      mapPendingInvoiceApiRow(
        buildApiRow({ admin_status: 'in_remittance' }),
        reference,
      ).status,
    ).toBe('En remisión');
    expect(
      mapPendingInvoiceApiRow(
        buildApiRow({ admin_status: 'unattended' }),
        reference,
      ).status,
    ).toBe('Sin atender');
  });

  it('prefers API evidence flags and OC when present', () => {
    const row = mapPendingInvoiceApiRow(
      buildApiRow({
        has_service_evidence: false,
        has_payment_evidence: true,
        purchase_order_number: 'OC-55',
        admin_status: 'in_remittance',
      }),
      reference,
    );
    expect(row.evidencia_rescate).toBe(false);
    expect(row.evidencia_pagos).toBe(true);
    expect(row.oc).toBe('OC-55');
  });

  it('derives month key and age from the ISO date', () => {
    expect(monthKeyFromPendingInvoiceDate('2026-01-15T00:00:00.000Z')).toBe(
      '2026-01',
    );
    expect(
      daysSincePendingInvoiceDate('2026-08-10T00:00:00.000Z', reference),
    ).toBe(2);
  });
});

describe('pending-invoice-evidence', () => {
  it('maps columns to rescue evidence types', () => {
    expect(pendingInvoiceEvidenceType('evidencia_rescate')).toBe('service');
    expect(pendingInvoiceEvidenceType('evidencia_pagos')).toBe(
      'payment_provider',
    );
  });

  it('builds zip filenames with the same complements as EvidenceModal', () => {
    expect(
      pendingInvoiceEvidenceZipFilename('PRE-2026-00227', 'evidencia_rescate'),
    ).toBe('PRE-2026-00227-evidencia-rescate.zip');
    expect(
      pendingInvoiceEvidenceZipFilename('PRE-2026-00227', 'evidencia_pagos'),
    ).toBe('PRE-2026-00227-evidencia-pago.zip');
  });
});
