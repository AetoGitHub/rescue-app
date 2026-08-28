import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { H3Event } from 'h3';
import {
  AUTH_REFRESH_TTL_MS,
  isAuthRefreshDue,
} from '../../shared/constants/session';
import {
  refreshAuthSession,
  resetAuthRefreshMutex,
  type AuthRefreshDeps,
  type RefreshableSession,
} from '../../server/utils/auth-refresh';

vi.mock('../../server/utils/report-session-auth', () => ({
  reportSessionAuthFailure: vi.fn(),
}));

vi.mock('../../server/utils/request-id', () => ({
  attachRequestId: () => 'req-test-id',
}));

beforeAll(() => {
  vi.stubGlobal(
    'createError',
    (input: { statusCode: number; message: string; data?: unknown; statusMessage?: string }) =>
      Object.assign(new Error(input.message), input),
  );
});

afterEach(() => {
  resetAuthRefreshMutex();
});

function session(overrides?: Partial<RefreshableSession>): RefreshableSession {
  return {
    user: {
      id: 1,
      name: 'Operador',
      role: 'operator',
    },
    token: 'token-1',
    ...overrides,
  };
}

function deps(overrides?: Partial<AuthRefreshDeps>): AuthRefreshDeps & {
  fetch: ReturnType<typeof vi.fn>;
  setSession: ReturnType<typeof vi.fn>;
  clearSession: ReturnType<typeof vi.fn>;
} {
  const fetch = vi.fn();
  const setSession = vi.fn().mockResolvedValue(undefined);
  const clearSession = vi.fn().mockResolvedValue(undefined);
  return {
    fetch,
    setSession,
    clearSession,
    getApiUrl: () => 'https://api.example.test',
    now: () => 1_700_000_000_000,
    ...overrides,
  } as AuthRefreshDeps & {
    fetch: ReturnType<typeof vi.fn>;
    setSession: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
  };
}

describe('isAuthRefreshDue', () => {
  it('is due when the session has never been refreshed', () => {
    expect(isAuthRefreshDue(undefined)).toBe(true);
  });

  it('is not due inside the TTL window', () => {
    const now = 1_000_000;
    expect(isAuthRefreshDue(now - AUTH_REFRESH_TTL_MS + 1, now)).toBe(false);
  });

  it('is due after the TTL window', () => {
    const now = 1_000_000;
    expect(isAuthRefreshDue(now - AUTH_REFRESH_TTL_MS, now)).toBe(true);
  });
});

describe('refreshAuthSession', () => {
  const event = { path: '/api/credit/check/' } as H3Event;

  it('skips Django when the TTL has not elapsed', async () => {
    const now = 1_700_000_000_000;
    const refreshDeps = deps({ now: () => now });
    await refreshAuthSession(
      event,
      session({ tokenRefreshedAt: now - 60_000 }),
      refreshDeps,
    );
    expect(refreshDeps.fetch).not.toHaveBeenCalled();
  });

  it('refreshes once and shares the in-flight call', async () => {
    const refreshDeps = deps();
    refreshDeps.fetch.mockResolvedValue({
      token: 'token-2',
      id: 1,
      name: 'Operador',
      role: 'operator',
    });

    const first = session();
    const second = session();
    await Promise.all([
      refreshAuthSession(event, first, refreshDeps),
      refreshAuthSession(event, second, refreshDeps),
    ]);

    expect(refreshDeps.fetch).toHaveBeenCalledTimes(1);
    expect(first.token).toBe('token-2');
    expect(second.token).toBe('token-2');
    expect(refreshDeps.setSession).toHaveBeenCalledTimes(2);
  });

  it('throws session_expired and clears the session on refresh 401', async () => {
    const refreshDeps = deps();
    refreshDeps.fetch.mockRejectedValue({ statusCode: 401 });
    const current = session();

    await expect(
      refreshAuthSession(event, current, refreshDeps),
    ).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'session_expired' },
    });

    expect(refreshDeps.clearSession).toHaveBeenCalledTimes(1);
    expect(current.token).toBeUndefined();
    expect(refreshDeps.setSession).not.toHaveBeenCalled();
  });

  it('keeps the current token when refresh fails with a transient error', async () => {
    const refreshDeps = deps();
    refreshDeps.fetch.mockRejectedValue({ statusCode: 502 });
    const current = session({ tokenRefreshedAt: undefined });

    await refreshAuthSession(event, current, refreshDeps);

    expect(current.token).toBe('token-1');
    expect(refreshDeps.clearSession).not.toHaveBeenCalled();
    expect(refreshDeps.setSession).not.toHaveBeenCalled();
  });
});
