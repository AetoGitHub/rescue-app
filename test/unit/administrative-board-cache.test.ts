import { describe, expect, it, vi } from 'vitest';
import {
  invalidateAdministrativeBoardCards,
  readAdministrativeViewRefreshCount,
} from '~/utils/administrative-board-cache';

describe('readAdministrativeViewRefreshCount', () => {
  it('reads count from object payload', () => {
    expect(readAdministrativeViewRefreshCount({ count: 1 })).toBe(1);
  });

  it('reads count from string in object payload', () => {
    expect(readAdministrativeViewRefreshCount({ count: '2' })).toBe(2);
  });

  it('reads plain number payload', () => {
    expect(readAdministrativeViewRefreshCount(3)).toBe(3);
  });

  it('returns null for missing or invalid values', () => {
    expect(readAdministrativeViewRefreshCount(null)).toBeNull();
    expect(readAdministrativeViewRefreshCount(undefined)).toBeNull();
    expect(readAdministrativeViewRefreshCount({})).toBeNull();
    expect(readAdministrativeViewRefreshCount({ count: '' })).toBeNull();
    expect(readAdministrativeViewRefreshCount({ count: 'abc' })).toBeNull();
  });
});

describe('invalidateAdministrativeBoardCards', () => {
  it('invalidates kanban cards, summaries, and list queries', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryCache = { invalidateQueries } as never;

    await invalidateAdministrativeBoardCards(queryCache);

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['administrative-rescue-cards'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['administrative-rescue-cards-summary'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['administrative-rescue-list'],
    });
  });
});
