import { describe, expect, it } from 'vitest';
import {
  buildOperationalCardsQuery,
  buildOperationalListQuery,
  emptyOperationalBoardFilters,
  operationalBoardFiltersKey,
} from '~/utils/operational-board-filters';

describe('emptyOperationalBoardFilters', () => {
  it('initializes alert flags as false', () => {
    expect(emptyOperationalBoardFilters()).toEqual({
      folio: '',
      serviceTypes: [],
      operativeStatuses: [],
      companyId: null,
      managerId: null,
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

  it('sends comma-separated operative statuses', () => {
    const query = buildOperationalListQuery({
      ...emptyOperationalBoardFilters(),
      operativeStatuses: ['closed', 'in_progress', 'requested'],
    });

    expect(query.status).toBe('closed,in_progress,requested');
  });

  it('sends folio, service_type, company and manager', () => {
    const query = buildOperationalListQuery({
      ...emptyOperationalBoardFilters(),
      folio: ' RES-1 ',
      serviceTypes: ['rescue', 'loan'],
      companyId: 3,
      managerId: 7,
    });

    expect(query).toEqual({
      folio: 'RES-1',
      service_type: 'rescue,loan',
      company: '3',
      manager: '7',
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
    expect(baseKey[4]).toBe('0');
    expect(withPending[4]).toBe('1');
  });
});
