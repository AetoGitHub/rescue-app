import { describe, expect, it } from 'vitest';
import {
  buildOperationalCardsQuery,
  emptyOperationalBoardFilters,
  operationalBoardFiltersKey,
} from '~/utils/operational-board-filters';

describe('emptyOperationalBoardFilters', () => {
  it('initializes alert flags as false', () => {
    expect(emptyOperationalBoardFilters()).toEqual({
      folio: '',
      serviceTypes: [],
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
