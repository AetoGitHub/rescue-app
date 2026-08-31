import { describe, expect, it } from 'vitest';
import {
  buildPaginatedQuery,
  canLoadNextCursorPage,
  extractCursorFromPaginatedNext,
  getNextCursorPageParam,
} from '../../app/utils/catalog-pagination';

describe('extractCursorFromPaginatedNext', () => {
  it('extracts only the cursor query from a full next URL', () => {
    expect(
      extractCursorFromPaginatedNext(
        'http://localhost:8010/api/dashboard/pending_invoice/?admin_status=unattended&cursor=abc123',
      ),
    ).toBe('abc123');
  });

  it('returns null when next is missing or has no cursor', () => {
    expect(extractCursorFromPaginatedNext(null)).toBeNull();
    expect(extractCursorFromPaginatedNext('')).toBeNull();
    expect(
      extractCursorFromPaginatedNext(
        'http://localhost:8010/api/dashboard/pending_invoice/?page=2',
      ),
    ).toBeNull();
    expect(
      extractCursorFromPaginatedNext('/api/dashboard/pending_invoice/'),
    ).toBeNull();
  });
});

describe('buildPaginatedQuery', () => {
  it('omits cursor on the first page', () => {
    expect(
      buildPaginatedQuery({ admin_status: 'unattended,in_remittance' }, null),
    ).toEqual({ admin_status: 'unattended,in_remittance' });
  });

  it('adds cursor only — never offset or page', () => {
    const query = buildPaginatedQuery(
      { company: '4', admin_status: 'unattended' },
      ' next-cursor ',
    );
    expect(query).toEqual({
      company: '4',
      admin_status: 'unattended',
      cursor: 'next-cursor',
    });
    expect(query).not.toHaveProperty('offset');
    expect(query).not.toHaveProperty('page');
  });
});

describe('getNextCursorPageParam', () => {
  it('stops when next is null', () => {
    expect(getNextCursorPageParam({ next: null, previous: null, results: [] })).toBeNull();
  });

  it('returns the cursor value for the next request', () => {
    expect(
      getNextCursorPageParam({
        next: 'https://api.example/api/dashboard/pending_invoice/?cursor=xyz',
        previous: null,
        results: [],
      }),
    ).toBe('xyz');
  });
});

describe('canLoadNextCursorPage', () => {
  it('allows load-more when a next cursor page exists and nothing is in flight', () => {
    expect(
      canLoadNextCursorPage({
        hasNextPage: true,
        isFetchingNextPage: false,
        isPending: false,
      }),
    ).toBe(true);
  });

  it('blocks while fetching the next page', () => {
    expect(
      canLoadNextCursorPage({
        hasNextPage: true,
        isFetchingNextPage: true,
        isPending: false,
      }),
    ).toBe(false);
  });

  it('blocks while the query is pending', () => {
    expect(
      canLoadNextCursorPage({
        hasNextPage: true,
        isFetchingNextPage: false,
        isPending: true,
      }),
    ).toBe(false);
  });

  it('stops when there is no next cursor page', () => {
    expect(
      canLoadNextCursorPage({
        hasNextPage: false,
        isFetchingNextPage: false,
      }),
    ).toBe(false);
  });
});
