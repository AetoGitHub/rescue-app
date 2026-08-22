import { describe, expect, it } from 'vitest';
import { mapFillOcStaffToken } from '~/utils/fill-oc-staff-token';

describe('mapFillOcStaffToken', () => {
  it('reads token from several payload shapes', () => {
    expect(mapFillOcStaffToken('abc')).toEqual({ token: 'abc', userId: null });
    expect(mapFillOcStaffToken({ token: 't1', user_id: 12 })).toEqual({
      token: 't1',
      userId: 12,
    });
    expect(mapFillOcStaffToken({ key: 't2', user: { id: 4 } })).toEqual({
      token: 't2',
      userId: 4,
    });
    expect(mapFillOcStaffToken({ auth_token: 't3' })).toEqual({
      token: 't3',
      userId: null,
    });
  });

  it('returns null when the payload has no token', () => {
    expect(mapFillOcStaffToken(null)).toBeNull();
    expect(mapFillOcStaffToken({})).toBeNull();
    expect(mapFillOcStaffToken('  ')).toBeNull();
  });
});
