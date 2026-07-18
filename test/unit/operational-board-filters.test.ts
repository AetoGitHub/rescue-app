import { describe, expect, it } from 'vitest';
import {
  buildOperationalCardsQuery,
  buildOperationalListQuery,
  emptyOperationalBoardFilters,
  operationalBoardFiltersKey,
} from '~/utils/operational-board-filters';
import { catalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';

describe('emptyOperationalBoardFilters', () => {
  it('initializes alert flags as false', () => {
    expect(emptyOperationalBoardFilters()).toEqual({
      folio: '',
      serviceTypes: [],
      operativeStatus: null,
      company: { value: null, label: '' },
      manager: { value: null, label: '' },
      client: { value: null, label: '' },
      pendingAdvance: false,
      slaAlert: false,
      commentAlert: false,
    });
  });
});

describe('buildOperationalCardsQuery alert filters', () => {
  it('omits alert params when flags are inactive', () => {
    const query = buildOperationalCardsQuery('approved', {
      ...emptyOperationalBoardFilters(),
    });

    expect(query).toEqual({ status: 'approved' });
    expect(query).not.toHaveProperty('pending_advance');
    expect(query).not.toHaveProperty('sla_alert');
    expect(query).not.toHaveProperty('comment_alert');
  });

  it('includes alert params only when active', () => {
    const query = buildOperationalCardsQuery('approved', {
      ...emptyOperationalBoardFilters(),
      pendingAdvance: true,
      slaAlert: true,
      commentAlert: true,
    });

    expect(query).toEqual({
      status: 'approved',
      pending_advance: 'true',
      sla_alert: 'true',
      comment_alert: 'true',
    });
  });
});

describe('buildOperationalListQuery', () => {
  it('omits status when no operative statuses are selected', () => {
    const query = buildOperationalListQuery(emptyOperationalBoardFilters());

    expect(query).toEqual({});
    expect(query).not.toHaveProperty('status');
    expect(query).not.toHaveProperty('cursor');
  });

  it('sends a single operative status', () => {
    const query = buildOperationalListQuery({
      ...emptyOperationalBoardFilters(),
      operativeStatus: 'closed',
    });

    expect(query.status).toBe('closed');
  });

  it('sends folio, service_type, company, manager and client', () => {
    const query = buildOperationalListQuery({
      ...emptyOperationalBoardFilters(),
      folio: ' RES-1 ',
      serviceTypes: ['rescue', 'loan'],
      company: catalogDropdownSelection(3, 'Co'),
      manager: catalogDropdownSelection(7, 'Gestor'),
      client: catalogDropdownSelection(11, 'Cliente'),
    });

    expect(query).toEqual({
      folio: 'RES-1',
      service_type: 'rescue,loan',
      company: '3',
      manager: '7',
      client: '11',
    });
    expect(query).not.toHaveProperty('pending_advance');
    expect(query).not.toHaveProperty('sla_alert');
    expect(query).not.toHaveProperty('comment_alert');
  });
});

describe('operationalBoardFiltersKey', () => {
  it('changes when alert flags toggle', () => {
    const base = emptyOperationalBoardFilters();
    const baseKey = operationalBoardFiltersKey(base);
    const withPending = operationalBoardFiltersKey({
      ...base,
      pendingAdvance: true,
    });

    expect(baseKey).not.toEqual(withPending);
    expect(baseKey[5]).toBe('0');
    expect(withPending[5]).toBe('1');
  });

  it('includes client id in the key', () => {
    const base = emptyOperationalBoardFilters();
    const withClient = operationalBoardFiltersKey({
      ...base,
      client: catalogDropdownSelection(42, 'Acme'),
    });

    expect(withClient[4]).toBe('42');
  });
});
