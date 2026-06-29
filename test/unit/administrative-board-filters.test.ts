import { describe, expect, it } from 'vitest';
import {
  buildAdministrativeCardsQuery,
  buildAdministrativeListQuery,
  emptyAdministrativeBoardFilters,
  filterAdministrativeCardsLocally,
  toggleAdministrativeBillingStatusFilter,
} from '~/utils/administrative-board-filters';
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';

function card(
  partial: Partial<AdministrativeRescueCard> & Pick<AdministrativeRescueCard, 'id'>,
): AdministrativeRescueCard {
  return {
    folio: 'R-1',
    service_type: 'rescue',
    client_id: 1,
    client_name: 'Acme',
    service_description: '',
    location_description: '',
    operator_id: 10,
    operator_name: 'Gestor',
    supplier_id: null,
    supplier_name: null,
    multiple_managers: false,
    sub_total: '1000',
    sale_price: '1000',
    net_profit: null,
    operative_status: 'closed',
    billing_status: 'unattended',
    created_at: '2026-06-01T12:00:00Z',
    phase_started_at: '2026-06-01T12:00:00Z',
    last_comment_at: null,
    unlocked_until: null,
    service_date: '2026-06-01',
    seller_id: null,
    remittance_folio: null,
    invoice_folio: null,
    ...partial,
  };
}

describe('buildAdministrativeCardsQuery', () => {
  it('sends status for kanban column', () => {
    const query = buildAdministrativeCardsQuery(
      'unattended',
      emptyAdministrativeBoardFilters(),
    );
    expect(query).toEqual({ status: 'unattended' });
  });

  it('sends all admin statuses when list has no status filter', () => {
    const query = buildAdministrativeCardsQuery(
      null,
      emptyAdministrativeBoardFilters(),
    );
    expect(query.status).toBe(
      'unattended,in_remittance,invoiced,paid,warranty,canceled',
    );
  });

  it('sends folio, service_type and company', () => {
    const query = buildAdministrativeCardsQuery('paid', {
      ...emptyAdministrativeBoardFilters(),
      folio: 'ABC-99',
      serviceTypes: ['rescue', 'loan', 'direct_budget'],
      companyId: 5,
    });
    expect(query.status).toBe('paid');
    expect(query.folio).toBe('ABC-99');
    expect(query.service_type).toBe('rescue,loan');
    expect(query.company).toBe('5');
  });
});

describe('buildAdministrativeListQuery', () => {
  it('omits status when no billing statuses are selected', () => {
    const query = buildAdministrativeListQuery(emptyAdministrativeBoardFilters());

    expect(query).toEqual({});
    expect(query).not.toHaveProperty('status');
    expect(query).not.toHaveProperty('cursor');
  });

  it('sends comma-separated billing statuses', () => {
    const query = buildAdministrativeListQuery({
      ...emptyAdministrativeBoardFilters(),
      billingStatuses: ['paid', 'unattended'],
    });

    expect(query.status).toBe('paid,unattended');
  });

  it('sends folio, service_type and company', () => {
    const query = buildAdministrativeListQuery({
      ...emptyAdministrativeBoardFilters(),
      folio: 'ABC-99',
      serviceTypes: ['rescue', 'loan', 'direct_budget'],
      companyId: 5,
    });

    expect(query).toEqual({
      folio: 'ABC-99',
      service_type: 'rescue,loan',
      company: '5',
    });
  });
});

describe('filterAdministrativeCardsLocally', () => {
  it('filters by operative status client-side', () => {
    const rows = [
      card({ id: 1, operative_status: 'closed' }),
      card({ id: 2, operative_status: 'closed_unpaid' }),
    ];
    const filtered = filterAdministrativeCardsLocally(rows, {
      ...emptyAdministrativeBoardFilters(),
      operativeStatuses: ['closed'],
    });
    expect(filtered.map((r) => r.id)).toEqual([1]);
  });
});

describe('toggleAdministrativeBillingStatusFilter', () => {
  it('toggles billing status values', () => {
    const next = toggleAdministrativeBillingStatusFilter([], 'paid');
    expect(next).toEqual(['paid']);
    expect(toggleAdministrativeBillingStatusFilter(next, 'paid')).toEqual([]);
  });
});
