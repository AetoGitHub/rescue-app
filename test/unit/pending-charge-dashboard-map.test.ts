import { describe, expect, it } from 'vitest';
import { PENDING_CHARGE_DETAIL_COLUMNS } from '../../app/constants/pending-charge';
import { PENDING_CHARGE_ORDERING_FIELDS } from '../../app/constants/pending-charge-api';
import {
  pendingChargeCsvIdQuery,
  pendingChargeOrderingParam,
  pendingChargeStatusQuery,
} from '../../app/utils/pending-charge-dashboard-map';

describe('pendingChargeCsvIdQuery', () => {
  it('returns a comma-separated list for multi-select', () => {
    expect(
      pendingChargeCsvIdQuery([
        { id: 1, name: 'A' },
        { id: 0, name: 'fallback' },
        { id: 4, name: 'B' },
      ]),
    ).toBe('1,4');
  });

  it('returns undefined when there are no positive ids', () => {
    expect(pendingChargeCsvIdQuery([])).toBeUndefined();
    expect(
      pendingChargeCsvIdQuery([{ id: 0, name: 'Solo nombre' }]),
    ).toBeUndefined();
  });
});

describe('pending charge API ordering whitelist', () => {
  it('matches the backend-valid fields', () => {
    expect([...PENDING_CHARGE_ORDERING_FIELDS]).toEqual([
      'id',
      'company_name',
      'client_name',
      'rfc',
      'responsible_name',
      'invoice_date',
      'due_date',
      'status',
      'total',
    ]);
  });

  it('only maps sortable table columns to whitelisted API fields', () => {
    const mapped = PENDING_CHARGE_DETAIL_COLUMNS
      .filter(column => column.ordering != null)
      .map(column => [column.id, column.ordering]);

    expect(mapped).toEqual([
      ['cliente', 'client_name'],
      ['compania', 'company_name'],
      ['rfc', 'rfc'],
      ['responsable', 'responsible_name'],
      ['fecha_factura', 'invoice_date'],
      ['vencimiento', 'due_date'],
      ['status', 'status'],
      ['total', 'total'],
    ]);
  });

  it('does not send API ordering for días vencidos', () => {
    const days = PENDING_CHARGE_DETAIL_COLUMNS.find(
      column => column.id === 'dias_vencidos',
    );
    expect(days?.ordering).toBeUndefined();
    expect(pendingChargeOrderingParam(days, true)).toBe('');
    expect(pendingChargeOrderingParam(days, false)).toBe('');
  });
});

describe('pendingChargeOrderingParam', () => {
  it('prefixes a minus for descending API fields', () => {
    expect(pendingChargeOrderingParam({ ordering: 'total' }, true)).toBe('-total');
    expect(pendingChargeOrderingParam({ ordering: 'due_date' }, false)).toBe(
      'due_date',
    );
  });

  it('returns empty when no column ordering is set', () => {
    expect(pendingChargeOrderingParam(null, true)).toBe('');
    expect(pendingChargeOrderingParam({}, false)).toBe('');
  });

  it('returns empty for fields the API does not accept', () => {
    expect(pendingChargeOrderingParam({ ordering: 'days_overdue' }, true)).toBe(
      '',
    );
    expect(pendingChargeOrderingParam({ ordering: 'balance' }, false)).toBe('');
    expect(pendingChargeOrderingParam({ ordering: 'folio' }, true)).toBe('');
  });
});

describe('pendingChargeStatusQuery', () => {
  it('joins API statuses for the query param', () => {
    expect(pendingChargeStatusQuery(['vencida', 'por_vencer'])).toBe(
      'vencida,por_vencer',
    );
  });

  it('skips the API param when sin crédito is selected', () => {
    expect(pendingChargeStatusQuery(['sin_credito'])).toBeUndefined();
    expect(pendingChargeStatusQuery(['bien', 'sin_credito'])).toBeUndefined();
  });

  it('returns undefined when nothing is selected', () => {
    expect(pendingChargeStatusQuery([])).toBeUndefined();
  });
});
